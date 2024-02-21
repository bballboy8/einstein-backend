const mongoose = require("mongoose");

var NewChatSchema = new mongoose.Schema({
  
  user_id: {
    type: String,
    maxLength: 1000
  },
  chat_title: {
    type: String,
    maxLength: 10000,
  },
  type: {
    type: String,
    maxLength: 100
  },
  history: {
    type: Array,
    maxLength: 100,
  }
}, {
  timestamps: true
});

var newChat = mongoose.model("ChatHistory", NewChatSchema);

module.exports = newChat;
