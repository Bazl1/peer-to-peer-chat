import { useContext, useEffect, useState } from "react";
import s from "./HomePage.module.scss";
import ReactPlayer from "react-player";
import PeerService from "../../services/PeerService";
import { useSocket } from "../../assets/hooks/SocketProvider";

const HomePage = () => {
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [fromName, setFromName] = useState<string>("");
    const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);

    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [caller, setCaller] = useState<boolean>(false);
    const [callerSignal, setCallerSignal] = useState<boolean>(false);

    const [callAccepted, setCallAccepted] = useState<boolean>(false);

    const socket = useSocket();

    const sendStreams = () => {
        if (myStream && PeerService && PeerService.peer) {
            for (const track of myStream.getTracks()) {
                PeerService.peer.addTrack(track, myStream);
            }
        }
    };

    const userCall = async (e: any) => {
        e.preventDefault();
        console.log(socket);

        await socket.emit("call", userId, name);
        setCaller(true);
    };

    const handleInfoCall = (FromId: string, FromName: string) => {
        setRemoteSocketId(FromId);
        setFromName(FromName);
        setCallerSignal(true);
    };

    const handleCallTo = async (value: boolean) => {
        console.log(socket);

        await socket.emit("call:answer", remoteSocketId, value);
        setCallerSignal(false);
    };

    const handleCallMe = async (value: boolean) => {
        console.log(socket);

        await socket.emit("call:answer", userId, value);
        setCaller(false);
        setUserId("");
        setName("");
    };

    const handleCallAnswer = async (FromId: string, value: boolean) => {
        console.log("handleCallAnswer start");
        setCaller(false);
        setCallerSignal(false);
        setUserId("");
        setName("");
        if (value) {
            console.log(socket);
            const offer = await PeerService.getOffer();
            await socket.emit("send:offer", FromId, offer);
            setCallAccepted(true);
            console.log("SendOffer end");
        }

        console.log("handleCallAnswer end");
    };

    const handleOfferReceived = async (FromId: string, offer: RTCSessionDescriptionInit) => {
        console.log("handleOfferReceived start");
        const ans = await PeerService.getAnswer(offer);
        await socket.emit("send:answer", FromId, ans);
        console.log("handleOfferReceived end");
    };

    const handleAnswerReceived = async (FromId: string, ans: RTCSessionDescriptionInit) => {
        console.log("handleAnswerReceived start");
        PeerService.setLocalDescription(ans);
        sendStreams();
        console.log("handleAnswerReceived end");
    };

    const handleNegoNeeded = async () => {
        console.log("handleNegoNeeded start");
        const offer = await PeerService.getOffer();
        await socket.emit("send_back:offer", remoteSocketId, offer);
        console.log("handleNegoNeeded end");
    };

    const handleOfferReceivedBack = async (FromId: string, offer: RTCSessionDescriptionInit) => {
        console.log("handleOfferReceivedBack start");
        const ans = await PeerService.getAnswer(offer);
        await socket.emit("send_back:answer", FromId, ans);
        console.log("handleOfferReceivedBack end");
    };

    const handleAnswerReceivedBack = async (FromId: string, ans: RTCSessionDescriptionInit) => {
        console.log("handleAnswerReceivedBack start");
        PeerService.setLocalDescription(ans);
        sendStreams();
        console.log("handleAnswerReceivedBack end");
    };

    useEffect(() => {
        socket.on("call:me", handleInfoCall);
        socket.on("call:result", handleCallAnswer);
        socket.on("offer:received", handleOfferReceived);
        socket.on("answer:received", handleAnswerReceived);

        socket.on("offer_back:received", handleOfferReceivedBack);
        socket.on("answer_back:received", handleAnswerReceivedBack);

        return () => {
            socket.off("call:me", handleInfoCall);
            socket.off("call:result", handleCallAnswer);
            socket.off("offer:received", handleOfferReceived);
            socket.off("answer:received", handleAnswerReceived);

            socket.off("offer_back:received", handleOfferReceivedBack);
            socket.off("answer_back:received", handleAnswerReceivedBack);
        };
    }, []);

    useEffect(() => {
        PeerService &&
            PeerService.peer &&
            PeerService.peer.addEventListener("track", async (ev) => {
                const remoteStream = ev.streams;
                console.log("GOT TRACKS!!");
                setRemoteStream(remoteStream[0]);
            });
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setMyStream(stream);
        });

        PeerService && PeerService.peer && PeerService.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            PeerService &&
                PeerService.peer &&
                PeerService.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
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
                                Your ID: <span>{socket}</span>
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
