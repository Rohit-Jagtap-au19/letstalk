import React, { useContext, useEffect, useState, useRef } from 'react'
import { UserContext } from '../context/UserContext'
import { useHistory } from "react-router-dom"
import axios from 'axios'
import moment from 'moment'
import io from "socket.io-client"
import colors from "../colors"
import "./chatpage.css"

const socket = io();

const ChatPage = (props) => {
    const history = useHistory(0)

    const [text, setText] = useState("")
    const [chat, setChat] = useState({})
    const [messages, setMessages] = useState([])
    const [participants, setParticipants] = useState([])

    const { user, setUser } = useContext(UserContext)
    const bottomRef = useRef()


    const getChat = () => {
        return chat
    }

    const handleSendText = (e) => {
        e.preventDefault()

        if (!text)
            return

        socket.emit("message", chat._id, {
            content: text,
            sentOn: Date.now(),
            user: user._id
        })

        setText("")
    }

    useEffect(() => {
        axios.get(axios.defaults.baseURL + `api/chats/${props.id}`).then(res => {
            console.log(res.data);
            setChat(res.data)
            setMessages(res.data.messages)

            if (user && !res.data.participants.includes(user._id))
                history.push("/")

            setParticipants([])

            res.data.participants.forEach(p => {
                axios.get(axios.defaults.baseURL + `api/users/${p}`).then(r => {
                    setParticipants(participants => [...participants, r.data])
                }).catch(err => console.log(err))
            })
        }).catch(err => history.push("/"))

        if (user === null)
            history.push("/login")


    }, [user])

    useEffect(() => {
        socket.on("message", async (response) => {
            const theChat = (await axios.get(axios.defaults.baseURL + `api/chats/${props.id}`)).data

            if (theChat._id == response.chat)
                setMessages(messages => [...messages, response.msg])
        })
    }, [])

    useEffect(() => bottomRef.current.scrollIntoView())

    return (
        <div>
            <div className="screen p-5 d-flex">
                {
                    messages.map((item, idx) => (
                        user && item.user === user._id ?
                            <div
                                className="bg-dark text-light p-2 rounded my-2"
                                style={{ alignSelf: "flex-end", maxWidth: "60vw" }}
                                key={idx}
                            >
                                <p>
                                    {item.content}
                                </p>
                                <p>You {moment(item.sentOn).format(`[at] h:mm A`)}</p>
                            </div> :

                            <div
                                key={idx}
                                className="text-light p-2 rounded my-2"
                                style={{
                                    alignSelf: "flex-start", maxWidth: "60vw",
                                    backgroundColor: colors[participants.map(p => p._id).indexOf(item.user)]
                                }}
                            >
                                <p>
                                    {item.content}
                                </p>
                                <p>{participants.find(p => p._id === item.user) ?
                                    participants.find(p => p._id === item.user).alias : null} on {moment(item.sentOn).format("MMM DD [at] h:mm A")}</p>
                            </div>
                    ))
                }

            </div>
            <div ref={bottomRef}></div>
            <form
                className="fixed-bottom d-flex align-items-center p-1"
                onSubmit={handleSendText}
            >
                <div style={{ flex: 0.9 }} className="mx-0">
                    <input
                        type="text"
                        className="rounded p-2 text-dark col-12 hi"
                        onChange={e => setText(e.target.value)}
                        value={text}
                    />
                </div>
                <button style={{ flex: 0.1 }} className="btn btn-info">Send</button>
            </form>
        </div>
    )
}

export default ChatPage
