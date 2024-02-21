const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const OpenAIApi = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sdk = require('api')('@pplx/v0#b2wdhb1klq5dn1d6');
const mistral_sdk = require('api')('@togetherdocs/v0.2#gdyr1qlrl2waw6');
const newChat = require("../models/newChat");
const users = require("../models/User")

const GPT_3_AI = new OpenAIApi({
  apiKey: process.env.GPT3_KEY,
});

const GPT_4_AI = new OpenAIApi({
  apiKey: process.env.GPT4_KEY,
});

class TextGenerateController {

  async GPT3(req, res) {

    console.log('GPT3 start', req.body.id);
    let response_data = ""
    let data = [];
    let token = 0;
    let token_price = 0;
    let rest_price = 0;
    
    try {
      if (req.body.id == "") {
        const stream = await GPT_3_AI.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{role: 'system', content: 'Be precise and concise.'}, { role: "user", content: req.body.prompt }],
          "temperature": 0.7,
          stream: true,
          max_tokens: 256
        });
        for await (const chunk of stream) {
          process.stdout.write(chunk.choices[0]?.delta?.content || "");
          data.push(chunk.choices[0].delta.content)
        }
        response_data = data.join('');
        console.log('data save start')
        const chat = new newChat({
          user_id: req.body.userID,
          chat_title: req.body.prompt,
          type: req.body.type,
          history: [[{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": response_data, "type": req.body.type}]]
        });
        console.log('data save finish')
        const savedChat = await chat.save();
        const objectId = new mongoose.Types.ObjectId(savedChat._id);
        const objectIdString = objectId.toString();
        token =  req.body.prompt.length + response_data.length
        token_price = (token / 4) * (0.002 / 1000) * 20
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(2)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        return res.status(200).json({ data: response_data, id: objectIdString, date: savedChat.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) }) 
      } else {
        try {   
          let add_reponse_data = []
          add_reponse_data.push({role: 'system', content: 'Be precise and concise.'})
          add_reponse_data = [...req.body.pasthistory]
          add_reponse_data.push({"role": "user", "content": req.body.prompt})
          const stream = await GPT_3_AI.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: add_reponse_data,
            "temperature": 0.7,
            stream: true,
            max_tokens: 256
          });
          for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
            data.push(chunk.choices[0].delta.content)
          }
          response_data = data.join('');
          let chat = await newChat.findOneAndUpdate(
            { _id: new ObjectId(req.body.id) }, 
            { $push: { history: [{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": response_data, "type": req.body.type}] }},
            { new: true, useFindAndModify: false }
          );
          await chat.save();
          token =  req.body.prompt.length + response_data.length
          token_price = (token / 4) * (0.002 / 1000) * 20
          console.log('update generate start', )
          let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
          rest_price = user.price - token_price.toFixed(2)
          let userData = await users.findOneAndUpdate(
            { _id: new ObjectId(req.body.userID) },
            { $set: {price : rest_price}}
          );
          await userData.save()
          return res.status(200).json({ data: response_data , id: req.body.id }) 
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  async GPT4(req, res) {
    
    console.log('GPT4 start', req.body.id);
    let response_data = ""
    let data = [];
    let token = 0;
    let token_price = 0;
    let rest_price = 0;
    
    try {
      if (req.body.id == "") {
        console.log('new gpt4 generate')
        const stream = await GPT_4_AI.chat.completions.create({
          model: "gpt-4-1106-preview",
          messages: [{role: 'system', content: 'Be precise and very concise.'}, { role: "user", content: req.body.prompt }],
          stream: true,
          max_tokens: 256
        });
        for await (const chunk of stream) {
          process.stdout.write(chunk.choices[0]?.delta?.content || "");
          data.push(chunk.choices[0].delta.content)  
        }
        response_data = data.join('');
        const chat = new newChat({
          user_id: req.body.userID,
          chat_title: req.body.prompt,
          type: req.body.type,
          history: [[{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": response_data, "type": req.body.type}]]
        });
        const savedChat = await chat.save();
        const objectId = new mongoose.Types.ObjectId(savedChat._id);
        const objectIdString = objectId.toString();
        token =  req.body.prompt.length + response_data.length
        token_price = (token / 4) * (0.06 / 1000) * 10
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(2)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        return res.status(200).json({ data: response_data, type: req.body.type, id: objectIdString, date: savedChat.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) }) 
      } else {
        try {
          let add_reponse_data = []
          add_reponse_data.push({role: 'system', content: 'Be precise and concise.'})
          add_reponse_data = [...req.body.pasthistory]
          add_reponse_data.push({"role": "user", "content": req.body.prompt})
          const stream = await GPT_4_AI.chat.completions.create({
            model: "gpt-4",
            messages: add_reponse_data,
            stream: true,
            max_tokens: 256
          });
          for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
            data.push(chunk.choices[0].delta.content)  
          }
          response_data = data.join('');
          let chat = await newChat.findOneAndUpdate(
            { _id: new ObjectId(req.body.id) }, 
            { $push: { history: [{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": response_data, "type": req.body.type}] }},
            { new: true, useFindAndModify: false }
          );
          await chat.save();
          token =  req.body.prompt.length + response_data.length
          token_price = (token / 4) * (0.06 / 1000) * 10
          let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
          rest_price = user.price - token_price.toFixed(2)
          let userData = await users.findOneAndUpdate(
            { _id: new ObjectId(req.body.userID) },
            { $set: {price : rest_price}}
          );
          await userData.save()
          return res.status(200).json({ data: response_data, id: req.body.id, type: req.body.type }) 
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  async Gemini(req, res) {
    console.log('Gemini start')
    let token = 0;
    let token_price = 0;
    let rest_price = 0;
    const genAI = new GoogleGenerativeAI(process.env.Gemini_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    try {
      if(req.body.id == "") {
        const prompt = req.body.prompt
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const chat = new newChat({
          user_id: req.body.userID,
          chat_title: req.body.prompt,
          type: req.body.type,
          history: [[{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": text, "type": req.body.type}]]
        });
        const savedChat = await chat.save();
        const objectId = new mongoose.Types.ObjectId(savedChat._id);
        const objectIdString = objectId.toString();
        token =  req.body.prompt.length + text.length
        token_price = (token / 4) * (0.0005 / 250) * 10
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(2)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        res.status(200).json({data: text, id: objectIdString, type:req.body.type, date: savedChat.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })})
      } else {
        try {   
          let data = [];
          let a = [...req.body.pasthistory]
          a.map((item, index) => {
            if(index % 2 == 0) {
              data.push({role: "user", parts: item.content})
            } else {
              data.push({role: "model", parts:item.content})
            }
          })
          console.log('*&*&*&*&&*&*&', data)
          const chat = model.startChat({
            history: data,
          });
          const result = await chat.sendMessage(req.body.prompt);
          const response = result.response;
          const text = response.text();
          console.log(text);  
          let chatData = await newChat.findOneAndUpdate(
            { _id: new ObjectId(req.body.id) }, 
            { $push: { history: [{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": text, "type": req.body.type}] }},
            { new: true, useFindAndModify: false }
          );
          await chatData.save();
          token =  req.body.prompt.length + text.length
          token_price = (token / 4) * (0.0005 / 250) * 10
          let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
          rest_price = user.price - token_price.toFixed(2)
          let userData = await users.findOneAndUpdate(
            { _id: new ObjectId(req.body.userID) },
            { $set: {price : rest_price}}
          );
          await userData.save()
          return res.status(200).json({ data: text , id: req.body.id, type:req.body.type }) 
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  async Mistral(req, res) {
    console.log('mistral start')
    let token = 0;
    let token_price = 0;
    let rest_price = 0;
    mistral_sdk.auth(process.env.MISTRAL_KEY);
    if (req.body.id == "") {
      try {
        let m_data = await mistral_sdk.chatCompletions({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [{role: 'system', content: 'Be precise and very concise.'}, {role: 'user', content: req.body.prompt}],
          max_tokens: 256,
          stop: ['</s>', '[/INST]'],
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          repetition_penalty: 1,
          n: 1
        });
        const chat = new newChat({
          user_id: req.body.userID,
          chat_title: req.body.prompt,
          type: req.body.type,
          history: [[{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": m_data.data.choices[0].message.content, "type": req.body.type}]]
        });
        const savedChat = await chat.save();
        const objectId = new mongoose.Types.ObjectId(savedChat._id);
        const objectIdString = objectId.toString();
        let string_data = m_data.data.choices[0].message.content;
        token =  req.body.prompt.length + string_data.length
        token_price = (token / 4) * (1.96 / 1000000) * 20
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(2)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        return res.status(200).json({ data: string_data, id: objectIdString, type:req.body.type, date: savedChat.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) })
      } catch (err) {
        console.log(err)
      }
    } else {
      console.log('update history')
      try {
        let a = [...req.body.pasthistory]
        a.push({"role": "user", "content": req.body.prompt})
        let m_data = await mistral_sdk.chatCompletions({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: a,
          max_tokens: 256,
          stop: ['</s>', '[/INST]'],
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          repetition_penalty: 1,
          n: 1
        });
        let string_data = m_data.data.choices[0].message.content
        let chat = await newChat.findOneAndUpdate(
          { _id: new ObjectId(req.body.id) }, 
          { $push: { history: [{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": string_data, "type": req.body.type}] }},
          { new: true, useFindAndModify: false }
        );
        await chat.save();
        token =  req.body.prompt.length + string_data.length
        token_price = (token / 4) * (1.96 / 1000000) * 20
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(5)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        return res.status(200).json({ data: string_data , id: req.body.id, type:req.body.type }) 
      } catch (err) {
        console.log(err)
      }
    }
  }

  async Perplexity(req, res) {
    let token = 0;
    let token_price = 0;
    let rest_price = 0;
    sdk.auth(process.env.Perplexity_KEY);
    if (req.body.id == "") {
      console.log('new perplexity generate')
      const data = await sdk.post_chat_completions({
        model: 'pplx-70b-online',
        messages: [ 
          {role: 'system', content: 'Be precise and very concise.'},
          {role: 'user', content: req.body.prompt}
        ],
        max_tokens: 256
      });
      let string_data = data.data.choices[0].message.content
      const chat = new newChat({
        user_id: req.body.userID,
        chat_title: req.body.prompt,
        type: req.body.type,
        history: [[{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": string_data, "type": req.body.type}]]
      });
      const savedChat = await chat.save();
      const objectId = new mongoose.Types.ObjectId(savedChat._id);
      const objectIdString = objectId.toString();
      token =  req.body.prompt.length + string_data.length
      token_price = (token / 4) * (0.28 / 1000000) * 20
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = user.price - token_price.toFixed(2)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: string_data, id: objectIdString, type:req.body.type, date: savedChat.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) })
    } else {
      let a = [...req.body.pasthistory]
      a.push({"role": "user", "content": req.body.prompt})
      const p_data = await sdk.post_chat_completions({
        model: 'pplx-70b-online',
        messages: a,
        max_tokens: 256
      });
      let string_data = p_data.data.choices[0].message.content
      let chat = await newChat.findOneAndUpdate(
        { _id: new ObjectId(req.body.id) }, 
        { $push: { history: [{ "role": "user", "content": req.body.prompt }, { "role": "assistant", "content": string_data, "type": req.body.type}] }},
        { new: true, useFindAndModify: false }
      );
      await chat.save();
      token =  req.body.prompt.length + string_data.length
      token_price = (token / 4) * (0.28 / 1000000) * 20
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = user.price - token_price.toFixed(2)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: string_data , id: req.body.id, type:req.body.type }) 
    }
  }

  async GetHistory(req, res) {
    let historyData = []
    const dat = new Date().toLocaleDateString();
    newChat.find({user_id: req.body.id}).then(users => {
      users.map((data) => {    
        
        const newItem = {
          id: data._id,
          title: data.chat_title,
          bot: data.history[0][1].content,
          date: new Date(data.createdAt)
        };

        const id = historyData.findIndex((item) => newItem.date > new Date(item.date));

        if (id === -1) {
          historyData.push(newItem);
        } else {
          historyData.splice(id, 0, newItem);
        }
      })

      historyData.map((item) => {
        if(dat == item.date.toLocaleDateString())
          item.date = item.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
        else 
          item.date = item.date.toLocaleDateString()
      })  
      console.log(historyData)
      return res.status(200).json({ data: historyData}) 
    }).catch(err => {
      console.error(err);
    });
  }

  async GetHistoryDataByID(req, res) {
    newChat.find({_id: new ObjectId(req.params.id)}).then(users => {
      return res.status(200).json({ data: users[0]}) 
    }).catch(err => {
      console.error(err);
    });
  }


  async Summarize(req, res) {

    console.log('summarize start', req.body.old_type)

    let e = []
    let data = []
    e = req.body.history
    let token = 0;
    let token_price = 0;
    let rest_price = 0;

    if (req.body.old_type=="GPT-3.5") {
      console.log('old gpt-3 summarize')
      const stream = await GPT_3_AI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: e,
        "temperature": 0.7,
        stream: true,
      });
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
        data.push(chunk.choices[0].delta.content)  
      }
      data = data.join("")
    } else if(req.body.old_type=="GPT-4") {
      const stream = await GPT_4_AI.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: e,
        stream: true,
      });
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
        data.push(chunk.choices[0].delta.content)  
      }
      data = data.join("")
    } else if (req.body.old_type == "Gemini") {
      let f = []
      const genAI = new GoogleGenerativeAI(process.env.Gemini_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      e.map((item, index) => {
        if(index % 2 == 0) {
          f.push({role: "user", parts: item.content})
        } else {
          f.push({role: "model", parts:item.content})
        }
      })
      console.log('old gemini data', f)
      let prompt = f[f.length - 1]['parts']
      f.splice(f.length-1, 1)
      const chat = model.startChat({
        history: f,
      });
      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      data = text
    } else if (req.body.old_type == "Perplexity") {
      sdk.auth(process.env.Perplexity_KEY);
      const p_data = await sdk.post_chat_completions({
        model: 'pplx-70b-online',
        messages: e,
      });
      data = p_data.data.choices[0].message.content
    } else if (req.body.old_type == "Mistral") {
      let m_data = await mistral_sdk.chatCompletions({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: e,
        max_tokens: 512,
        stop: ['</s>', '[/INST]'],
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        n: 1
      });
      data = m_data.data.choices[0].message.content
    }
    
    let index = req.body.history.length
    let a = []  
    
    if (req.body.new_type == "GPT-4") {
      console.log('new GPT4 start')
      a.push({"role": "system", "content": "This model is gpt-4-1106-preview model"})
      a.push({"role": "assistant", "content": data})
      a.push(req.body.history[index-1])
      let d = []
      const stream = await GPT_4_AI.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: a,
        stream: true,
        max_tokens: 256
      });
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
        d.push(chunk.choices[0].delta.content)  
      }
      let doc = await newChat.findOne({ _id: new ObjectId(req.body.id)})
      console.log(doc.history)
      let harray = doc.history
      doc.history[req.body.number].push({ "role": "assistant", "content": d.join(""), "type": req.body.new_type})
      await newChat.updateOne(
        { _id: new ObjectId(req.body.id) },
        { $set: { history: harray } }
      );
      token =  data.length + d.join("").length
      token_price = (token / 4) * (0.06 / 1000) * 10
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = (user.price - token_price).toFixed(2)
      console.log('updated price', rest_price)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: d.join("")}) 
    } else if(req.body.new_type == "GPT-3.5") {
      a.push({"role": "system", "content": "This model is gpt-3.5-turbo model"})
      a.push({"role": "assistant", "content": data})
      a.push(req.body.history[index-1])
      let d = []
      const stream = await GPT_3_AI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: a,
        "temperature": 0.7,
        stream: true,
        max_tokens: 256
      });
      for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
        d.push(chunk.choices[0].delta.content)  
      }
      let doc = await newChat.findOne({ _id: new ObjectId(req.body.id)})
      let harray = doc.history
      doc.history[req.body.number].push({ "role": "assistant", "content": d.join(""), "type": req.body.new_type})
      await newChat.updateOne(
        { _id: new ObjectId(req.body.id) },
        { $set: { history: harray } }
      );
      token =  data.length + d.join("").length
      token_price = (token / 4) * (0.002 / 1000) * 20
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = user.price - token_price.toFixed(2)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: d.join("")}) 
    } else if(req.body.new_type == "Gemini") {
      console.log('new Gemini start')
      const genAI = new GoogleGenerativeAI(process.env.Gemini_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      let f = []
      f.push({"role": "system", "content": "This model is gemini-pro model"})
      e.map((item, index) => {
        if(index % 2 == 0) {
          f.push({role: "user", parts: item.content})
        } else {
          f.push({role: "model", parts:item.content})
        }
      })
      let prompt = f[f.length - 1]['parts']
      a.push({"role": "user", "parts": prompt})
      a.push({"role": "model", "parts": data})
      console.log('*&*&*&*&*&*&*&*&*&', a, prompt)
      const chat = model.startChat({
        history: a,
      });
      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      console.log('#@#@#@##@#@##@#', text);
      let doc = await newChat.findOne({ _id: new ObjectId(req.body.id)})
      let harray = doc.history
      doc.history[req.body.number].push({ "role": "assistant", "content": text, "type": req.body.new_type})
      await newChat.updateOne(
        { _id: new ObjectId(req.body.id) },
        { $set: { history: harray } }
      );
      token =  prompt.length + data.length + text.length
      token_price = (token / 4) * (0.0005 / 250) * 20
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = user.price - token_price.toFixed(2)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: text}) 
    } else if(req.body.new_type == "Perplexity") {
      console.log('new Perplexity summarize start')
      a.push({"role": "system", "content": "This model is pplx-70b-online model."})
      a.push({"role": "assistant", "content": data })
      a.push(req.body.history[index-1])
      console.log('&^&^&^&^&^&^', a)
      sdk.auth(process.env.Perplexity_KEY);
      const p_data = await sdk.post_chat_completions({
        model: 'pplx-70b-online',
        messages: a,
        max_tokens: 256
      });
      let d = p_data.data.choices[0].message.content
      let doc = await newChat.findOne({ _id: new ObjectId(req.body.id)})
      let harray = doc.history
      doc.history[req.body.number].push({ "role": "assistant", "content": d, "type": req.body.new_type})
      await newChat.updateOne(
        { _id: new ObjectId(req.body.id) },
        { $set: { history: harray } }
      );
      token =  data.length + d.length
      token_price = (token / 4) * (0.28 / 1000000) * 20
      let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
      rest_price = user.price - token_price.toFixed(2)
      let userData = await users.findOneAndUpdate(
        { _id: new ObjectId(req.body.userID) },
        { $set: {price : rest_price}}
      );
      await userData.save()
      return res.status(200).json({ data: d }) 
    } else if (req.body.new_type == "Mistral") {
      try {
        console.log('new Mistral summarize start')
        a.push({"role": "system", "content": "This model is Mixtral-8x7B model"})
        a.push({"role": "assistant", "content": data })
        a.push(req.body.history[index-1])
        console.log('mistral new data', a)
        mistral_sdk.auth(process.env.MISTRAL_KEY);
        let m_data = await mistral_sdk.chatCompletions({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: a,
          max_tokens: 256,
          stop: ['</s>', '[/INST]'],
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          repetition_penalty: 1,
          n: 1
        });
        let d = m_data.data.choices[0].message.content
        let doc = await newChat.findOne({ _id: new ObjectId(req.body.id)})
        let harray = doc.history
        doc.history[req.body.number].push({ "role": "assistant", "content": d, "type": req.body.new_type})
        await newChat.updateOne(
          { _id: new ObjectId(req.body.id) },
          { $set: { history: harray } }
        );
        token =  data.length + d.length
        token_price = (token / 4) * (1.96 / 1000000) * 20
        let user = await users.findOne({ _id: new ObjectId(req.body.userID) });
        rest_price = user.price - token_price.toFixed(2)
        let userData = await users.findOneAndUpdate(
          { _id: new ObjectId(req.body.userID) },
          { $set: {price : rest_price}}
        );
        await userData.save()
        return res.status(200).json({ data: d }) 
      } catch(err) {
        console.log(err)
      }
    }
  }

  async getType (req, res) {
    let data = await newChat.findOne({ _id: new ObjectId(req.body.historyID)})
    let typeData = []
    data.history[req.body.id].map((item) => {
      if(item.type != null)
        typeData.push(item.type)
    })
    res.status(200).json({data: typeData})
  }

  async Regenerate (req, res) {
    console.log('start regenerate', req.body)
    if( req.body.type == "GPT-3.5" )
      {
        const openai  = new OpenAIApi({
          apiKey: process.env.GPT3_KEY,
        });
        let data = [];
        const stream = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: req.body.historyData,
          "temperature": 0.7,
          stream: true,
        });
        for await (const chunk of stream) {
          process.stdout.write(chunk.choices[0]?.delta?.content || "");
          data.push(chunk.choices[0].delta.content)  
        }
        let string_data = data.join('');
        return res.status(200).json({ data: string_data}) 
      } else if (req.body.type == "Gemini") {
        console.log('gemini generate start')
        const genAI = new GoogleGenerativeAI(process.env.Gemini_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        let data = []
        req.body.historyData.map((item, index) => {
          if(index % 2 == 0) {
            data.push({role: "user", parts: item.content})
          } else {
            data.push({role: "model", parts:item.content})
          }
        })
        
        console.log('*&*&*&*&&*&*&', data)
        let prompt = data[data.length - 1]['parts']
        console.log('&&&&&&&&&&', prompt)
        data.splice(data.length-1, 1)
        const chat = model.startChat({
          history: data,
        });
        const result = await chat.sendMessage(prompt);
        const response = result.response;
        const text = response.text();
        console.log(text);  
        return res.status(200).json({ data: text})
      } else if (req.body.type == "Perplexity") {
        console.log('Perplexity start')
        sdk.auth(process.env.Perplexity_KEY);
        const data = await sdk.post_chat_completions({
          model: 'pplx-70b-online',
          messages: req.body.historyData,
        });
        let string_data = data.data.choices[0].message.content
        return res.status(200).json({ data: string_data}) 
      }
  }

  async Search (req, res) {
    console.log('search start', req.body.searchString.toUpperCase())
    let result = []
    const dat = new Date().toLocaleDateString();
    newChat.find({ user_id: req.body.id }).then(user => {
      user.map((data) => {
        console.log(data.history[0][1].content.toUpperCase())
        if(data.chat_title.toUpperCase().indexOf(req.body.searchString.toUpperCase()) > -1 || data.history[0][1].content.toUpperCase().indexOf(req.body.searchString.toUpperCase()) > -1) {
          const newItem = {
            id: data._id,
            title: data.chat_title,
            bot: data.history[0][1].content,
            date: new Date(data.createdAt)
          };
          const id = result.findIndex((item) => newItem.date > new Date(item.date));
          if (id === -1) {
            result.push(newItem);
          } else {
            result.splice(id, 0, newItem);
          }
        }       
      })
      result.map((item) => {
        if(dat == item.date.toLocaleDateString())
          item.date = item.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
        else 
          item.date = item.date.toLocaleDateString()
      }) 
      return res.status(200).json({data: result})
    })
  }

  async clearHistory (req, res) {
    let clearHistory = [];
    console.log('clear history start', req.body.id)
    await newChat.findOneAndUpdate(
      { _id: new ObjectId(req.body.id) }, 
      { $set: { history: clearHistory }},
      { new: true, useFindAndModify: false }
    ).then(user => {
      console.log(user);
      return res.status(200).json({ message: 'Clear history success' })
    })
  }

}

module.exports = new TextGenerateController();