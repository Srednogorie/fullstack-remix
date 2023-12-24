// import WebSocket from 'ws'

import { useEffect, useState } from "react"

const Ws = () => {
    const [socket, setSocket] = useState(null)
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])

    useEffect(() => {
        const newSocket = new WebSocket("wss://0.0.0.0:8000/ws")
        setSocket(newSocket)
        return () => newSocket.close()
    }, [])


    useEffect(() => {
        if (!socket) return

        socket.onopen = function (event) {
            console.log("WebSocket connected")
        }

        socket.onmessage = function (event) {
            setMessages(messages => [...messages, event.data])
        };

        socket.onclose = function (event) {
            console.log("WebSocket closed")
        }

        return () => {
            socket.close()
        }
    }, [socket])
    
    const sendMessage = () => {   
        socket.send(message)
        setMessage("")
    };
    
    return (
        <div className="container">
          <h1>Chat</h1>
          {/* <h2>Your client id: {clientId} </h2> */}
          <div className="chat-container">
            <div className="chat">
              {messages.map((value, index) => {
                  return (
                    <div key={index} className="another-message-container">
                      <div className="another-message">
                        {/* <p className="client">client id : {clientId}</p> */}
                        <p className="message">{value}</p>
                      </div>
                    </div>
                  )
              })}
            </div>
            <div className="input-chat-container">
              <input
                className="input-chat"
                type="text"
                placeholder="Chat message ..."
                onChange={e => setMessage(e.target.value)}
                value={message}
              ></input>
              <button className="submit-chat" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
    )
}

export default Ws
