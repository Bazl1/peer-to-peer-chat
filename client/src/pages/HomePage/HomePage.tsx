import { useEffect, useState } from "react";
import s from "./HomePage.module.scss";
import ReactPlayer from "react-player";
import * as signalR from "@microsoft/signalr";

const HomePage = () => {
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [fromName, setFromName] = useState<string>("");

    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [caller, setCaller] = useState<boolean>(false);
    const [callerSignal, setCallerSignal] = useState<boolean>(false);
    const [connection, setConnection] = useState<signalR.HubConnection>();

    const userCall = async (e: any) => {
        e.preventDefault();
        await connection?.invoke("UserCall", userId, name);
        setCaller(true);
    };

    const handleInfoCall = async (FromId: string, FromName: string) => {
        setFromName(FromName);
        setCallerSignal(true);
    };

    const handleCall = async (value: boolean) => {};

    useEffect(() => {
        const createConnection = async () => {
            const newConnection = new signalR.HubConnectionBuilder().withUrl("http://localhost:5025").build();

            try {
                await newConnection.start();
                setConnection(newConnection);
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
    }, [setConnection]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setMyStream(stream);
        });

        connection?.on("Call:Me", handleInfoCall);
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
                            {remoteStream !== null && (
                                <>
                                    <h3 className={s.hero_home__title}>Your companion</h3>
                                    <ReactPlayer className={s.hero_home__video} playing muted url={remoteStream} />
                                </>
                            )}
                        </div>
                        <div className={s.hero_home__columns}>
                            <div className={s.hero_home__yourid}>
                                Your ID: <span>ID</span>
                            </div>
                            {caller ? (
                                <div className={s.hero_home__caller_box}>
                                    <div className={s.hero_home__caller}>You're calling</div>
                                    <button className={s.hero_home__btn}>Reset call</button>
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
                            )}
                        </div>
                        {callerSignal && (
                            <div className={s.hero_home__callersignal}>
                                <h3 className={s.hero_home__callersignal_name}>He's calling you {fromName}</h3>
                                <div className={s.hero_home__callersignal_btns}>
                                    <button className={s.hero_home__callersignal_btn} onClick={() => handleCall(true)}>
                                        Receive a call
                                    </button>
                                    <button className={s.hero_home__callersignal_btn} onClick={() => handleCall(false)}>
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
