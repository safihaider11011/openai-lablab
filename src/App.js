import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialChat = [
  {
    sender: "SADIQ",
    message: "I am Ṣādiq, what medical questions do you have?",
  },
];

const API_KEY = "API_KEY";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([initialChat]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const generateImage = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          prompt: `${chat[chat.length - 1].message}`,
          size: "256x256",
          n: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      setChat([
        ...chat,
        {
          sender: "IMAGE",
          message: res.data?.data[0]?.url,
          timestamp: Date.now(),
        },
      ]);
      setLoading(false);
    } catch {
      toast.error("Unable to generate image", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const currChat = [
      ...chat,
      { sender: "PATIENT", message, timestamp: Date.now() },
    ];

    setMessage("");
    setChat([...currChat]);
    setLoading(true);

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are Ṣādiq, an AI doctor. Please answer the medical questions based on the patient's description and your answer should be less than 100 words. You can ask more questions to clarify.",
            },
            {
              role: "user",
              content:
                [
                  ...currChat
                    .filter((c) => c.sender !== "IMAGE")
                    .map((c) => getMessageSender(c.sender) + ": " + c.message),
                ].join("\n\n") + "\n\nṢādiq:",
            },
          ],
          temperature: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      setChat([
        ...currChat,
        {
          sender: "SADIQ",
          message: res.data?.choices[0]?.message?.content,
          timestamp: Date.now(),
        },
      ]);
      setLoading(false);
    } catch {
      setMessage("");
      setLoading(false);
    }
  };

  const setInitialChat = () => {
    const curr = [...initialChat];
    curr[0].timestamp = Date.now();
    setChat([...curr]);
  };

  const getMessage = (m, i) => {
    return (
      <Fragment key={i}>
        <div
          className={`msgContainer ${
            m.sender === "PATIENT" ? "patientMsg" : "doctorMsg"
          }`}
        >
          {m.sender === "IMAGE" ? (
            <img src={m.message} alt="dalle" className="amiImage" />
          ) : (
            <>
              <div className="msg">{m.message}</div>
              {chat.length > 1 &&
                i === chat.length - 1 &&
                m.sender === "SADIQ" && (
                  <button className="amiBtn" onClick={generateImage}>
                    Generate AMI
                  </button>
                )}
            </>
          )}
        </div>
      </Fragment>
    );
  };

  const getMessageSender = (sender) => {
    switch (sender) {
      case "SADIQ":
        return "Ṣādiq";
      case "PATIENT":
        return "Patient";
      default:
        return null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    setInitialChat();
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="app">
        <h1>Ṣādiq</h1>

        <div className="chat">
          {chat.map((c, i) => getMessage(c, i))}
          <div ref={messagesEndRef} />
        </div>

        <div className="inputMessage">
          <div className="inner">
            <form onSubmit={handleSend}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
