import { useEffect, useState } from "react";
import s from "./HomePage.module.scss";
import ReactPlayer from "react-player";
import * as signalR from "@microsoft/signalr";
import PeerService from "../../services/PeerService";

const HomePage = () => {
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [fromName, setFromName] = useState<string>("");
    const [fromId, setFromId] = useState<string>("");

    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [caller, setCaller] = useState<boolean>(false);
    const [callerSignal, setCallerSignal] = useState<boolean>(false);

    const [callAccepted, setCallAccepted] = useState<boolean>(false);

    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const userCall = async (e: any) => {
        e.preventDefault();
        await connection?.invoke("Call", userId, name);
        setCaller(true);
    };

    const handleInfoCall = (FromId: string, FromName: string) => {
        setFromId(FromId);
        setFromName(FromName);
        setCallerSignal(true);
    };

    const handleCallTo = async (value: boolean) => {
        await connection?.invoke("CallAnswer", fromId, value);
        setCallerSignal(false);
    };

    const handleCallMe = async (value: boolean) => {
        await connection?.invoke("CallAnswer", userId, value);
        setCaller(false);
        setUserId("");
        setName("");
    };

    const handleCallAnswer = async (FromId: string, value: boolean) => {
        setCaller(false);
        setCallerSignal(false);
        setUserId("");
        setName("");
        if (value) {
            const offer = await PeerService.getOffer();
            await connection?.invoke("SendOffer", FromId, offer);
            setCallAccepted(true);
        }
    };

    const handleOfferReceived = async (FromId: string, offer: RTCSessionDescriptionInit) => {
        const ans = await PeerService.getAnswer(offer);
        await connection?.invoke("SendAnswer", FromId, ans);
    };

    useEffect(() => {
        const createConnection = async () => {
            const newConnection = new signalR.HubConnectionBuilder().withUrl("http://localhost:5025/meetings").build();

            try {
                await newConnection.start();
                setConnection(newConnection);

                newConnection.on("Call:Me", handleInfoCall);
                newConnection.on("Call:Answer", handleCallAnswer);
                newConnection.on("Offer:Received", handleOfferReceived);
            } catch (error) {
                console.error("Error starting SignalR connection:", error);
            }
        };

        createConnection();

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setMyStream(stream);
        });
    }, []);

    return (
        <main className="main">
            <section className={s.hero_home}>
                <div className="container">
                    <div className={s.hero_home__inner}>
                        <div className={s.hero_home__columns}>
                            <h3 className={s.hero_home__title}>Your stream</h3>
                            {myStream !== null && (
                                <ReactPlayer className={s.hero_home__video} playing muted url={myStream} />
                            )}
                            {callAccepted && <button className={s.hero_home__btn}>Reset call</button>}
                        </div>
                        <div className={s.hero_home__columns}>
                            <div className={s.hero_home__yourid}>
                                Your ID: <span>{connection?.connectionId}</span>
                            </div>
                            {!callAccepted ? (
                                caller ? (
                                    <div className={s.hero_home__caller_box}>
                                        <div className={s.hero_home__caller}>You're calling...</div>
                                        <button className={s.hero_home__btn} onClick={() => handleCallMe(false)}>
                                            Reset call
                                        </button>
                                    </div>
                                ) : (
                                    <form className={s.hero_home__form} onSubmit={userCall}>
                                        <input
                                            className={s.hero_home__input}
                                            type="text"
                                            placeholder="Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <input
                                            className={s.hero_home__input}
                                            type="text"
                                            placeholder="User id"
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                        />
                                        <button className={s.hero_home__btn} type="submit">
                                            Call
                                        </button>
                                    </form>
                                )
                            ) : (
                                remoteStream !== null && (
                                    <>
                                        <h3 className={s.hero_home__title}>Your companion</h3>
                                        <ReactPlayer className={s.hero_home__video} playing muted url={remoteStream} />
                                    </>
                                )
                            )}
                        </div>
                        {callerSignal && (
                            <div className={s.hero_home__callersignal}>
                                <h3 className={s.hero_home__callersignal_name}>He's calling you {fromName}</h3>
                                <div className={s.hero_home__callersignal_btns}>
                                    <button
                                        className={s.hero_home__callersignal_btn}
                                        onClick={() => handleCallTo(true)}
                                    >
                                        Receive a call
                                    </button>
                                    <button
                                        className={s.hero_home__callersignal_btn}
                                        onClick={() => handleCallTo(false)}
                                    >
                                        Reset call
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default HomePage;
