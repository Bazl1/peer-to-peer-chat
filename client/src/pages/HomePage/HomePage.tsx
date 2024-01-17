import { useCallback, useEffect, useRef, useState } from "react";
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

    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const socket = useSocket();

    const userCall = useCallback(
        async (e: any) => {
            e.preventDefault();

            await socket.emit("call", { to: userId, userName: name });
            setCaller(true);
        },
        [socket, userId],
    );

    const handleInfoCall = useCallback(
        (FromId: string, FromName: string) => {
            setRemoteSocketId(FromId);
            setFromName(FromName);
            setCallerSignal(true);
        },
        [socket],
    );

    const handleCallTo = useCallback(
        async (value: boolean) => {
            await socket.emit("call:answer", { to: remoteSocketId, answer: value });
            if (value) {
                const offer = await PeerService.getOffer();
                await socket.emit("send:offer", { to: remoteSocketId, offer });
                setCallAccepted(true);
            }
            setCallerSignal(false);
        },
        [socket, remoteSocketId],
    );

    const handleCallMe = useCallback(
        async (value: boolean) => {
            await socket.emit("call:answer", { to: userId, answer: value });
            setCaller(false);
            setUserId("");
            setName("");
        },
        [socket, userId],
    );

    const handleCallAnswer = useCallback(
        async (FromId: string, value: boolean) => {
            setCaller(false);
            setCallerSignal(false);
            setUserId("");
            setName("");
            if (value) {
                setRemoteSocketId(FromId);
                setCallAccepted(true);
            }
        },
        [socket],
    );

    const handleOfferReceived = useCallback(
        async (FromId: string, offer: RTCSessionDescriptionInit) => {
            const ans = await PeerService.getAnswer(offer);
            await socket.emit("send:answer", { to: FromId, answer: ans });

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (stream && PeerService && PeerService.peer) {
                stream.getTracks().forEach((track) => {
                    PeerService.peer && PeerService.peer.addTrack(track, stream);
                });
            }
        },
        [socket],
    );

    const handleAnswerReceived = useCallback(
        async (FromId: string, ans: RTCSessionDescriptionInit) => {
            PeerService.setLocalDescription(ans);

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (stream && PeerService && PeerService.peer) {
                stream.getTracks().forEach((track) => {
                    PeerService.peer && PeerService.peer.addTrack(track, stream);
                });
            }

            const offer = await PeerService.getOffer();
            await socket.emit("send_back:offer", { to: FromId, offer });
        },
        [socket],
    );

    const handleOfferReceivedBack = useCallback(
        async (FromId: string, offer: RTCSessionDescriptionInit) => {
            const ans = await PeerService.getAnswer(offer);
            await socket.emit("send_back:answer", { to: FromId, answer: ans });
        },
        [socket],
    );

    const handleAnswerReceivedBack = useCallback(
        async (ans: RTCSessionDescriptionInit) => {
            PeerService.setLocalDescription(ans);
        },
        [socket],
    );

    useEffect(() => {
        const handleTrack = (event: any) => {
            const remoteStream = event.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
            remoteVideoRef && remoteVideoRef.current && (remoteVideoRef.current.srcObject = remoteStream[0]);
        };

        PeerService && PeerService.peer && PeerService.peer.addEventListener("track", handleTrack);
        return () => {
            PeerService && PeerService.peer && PeerService.peer.removeEventListener("track", handleTrack);
        };
    }, [socket]);

    const initSteam = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);
        myVideoRef && myVideoRef.current && (myVideoRef.current.srcObject = stream);
    };

    useEffect(() => {
        initSteam();
    }, [socket]);

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
    }, [socket]);

    return (
        <main className="main">
            <section className={s.hero_home}>
                <div className="container">
                    <div className={s.hero_home__inner}>
                        <div className={s.hero_home__columns}>
                            <h3 className={s.hero_home__title}>Your stream</h3>
                            {myStream !== null && (
                                <video className={s.hero_home__video} ref={myVideoRef} autoPlay muted />
                            )}
                            {callAccepted && <button className={s.hero_home__btn}>Reset call</button>}
                        </div>
                        <div className={s.hero_home__columns}>
                            <div className={s.hero_home__yourid}>Your ID: {socket.id}</div>
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
                                        <video className={s.hero_home__video} ref={remoteVideoRef} autoPlay />
                                        <button onClick={() => console.log(remoteStream)}>click</button>
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
