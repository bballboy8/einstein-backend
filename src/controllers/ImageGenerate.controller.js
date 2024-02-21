const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const OpenAIApi = require("openai");
const sdk = require('api')('@togetherdocs/v0.2#gdyr1qlrl2waw6');
const imgHistory = require("../models/imgHistory");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const Dall_E = new OpenAIApi({
  apiKey: process.env.DALL_E,
});

class ImageGenerateController {
  
  async Dall_E (req, res) {
    console.log('Dall-E start', req.body.id)
    let dall_e_data = [];
    let file_name = ""
    let file_path = ""
    try {
      if (req.body.id == "") {
        const image = await Dall_E.images.generate({
          model: "dall-e-2", 
          response_format: "b64_json",
          prompt: req.body.prompt,
          n:4
        });
        for (let i = 0; i < 4; i++) {
          const imageBuffer = Buffer.from(image.data[i].b64_json, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          dall_e_data.push({url: file_path})
        }
        const img = new imgHistory({
          user_id: req.body.userID,
          prompt: req.body.prompt,
          type: req.body.type,
          history: [[{ role: "user", content: req.body.prompt }, { role: "assistant", content: dall_e_data, type: req.body.type}]]
        });
        const img_data = await img.save();
        const objectId = new mongoose.Types.ObjectId(img_data._id);
        const objectIdString = objectId.toString();
        res.status(200).json({ data: dall_e_data, type: img_data.type, id: objectIdString, date: img_data.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) })
      } else {
        const image = await Dall_E.images.generate({
          model: "dall-e-2",
          response_format: "b64_json",
          prompt: req.body.prompt,
          n: 4
        });
        for (let i = 0; i < 4; i++) {
          const imageBuffer = Buffer.from(image.data[i].b64_json, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          dall_e_data.push({url: file_path})
        }
        let chat = await imgHistory.findOneAndUpdate(
          { _id: new ObjectId(req.body.id) }, 
          { $push: { history: [{role: "user", content: req.body.prompt}, {role: "assistant", content: dall_e_data, type: req.body.type}] }},
          { new: true, useFindAndModify: false }
        );
        await chat.save();
        res.status(200).json({ data: dall_e_data, id: req.body.id, type: req.body.type })
      }
    } catch (err) {
      console.log(err)
    }
  }

  async Stable_Diffusion_XL (req, res) {
    
    console.log('stable diffusion xl start', req.body.size);
    let file_name = "";
    let file_path = "";

    if (req.body.id == "") {
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: req.body.prompt,
        n: 4,
        size: req.body.size
      }).then(async (data) => {
        let stable_xl_data = []
        console.log(JSON.parse(data.data).choices)
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        const img = new imgHistory({
          user_id: req.body.userID,
          prompt: req.body.prompt,
          type: req.body.type,
          history: [[{ role: "user", content: req.body.prompt }, { role: "assistant", content: stable_xl_data, type: req.body.type, size: req.body.size }]]
        });
        let img_data = await img.save();
        const objectId = new mongoose.Types.ObjectId(img_data._id);
        const objectIdString = objectId.toString();
        res.status(200).json({ data: stable_xl_data, type: img_data.type, id: objectIdString, date: img_data.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) })
      })
    } else {
      console.log('**&*&*&**&*&*', req.body.type, req.body.size)
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: req.body.prompt,
        n: 4,
        size: req.body.size
      }).then(async (data) => {
        let stable_xl_data = []
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        let img_Data = await imgHistory.findOneAndUpdate(
          { _id: new ObjectId(req.body.id) }, 
          { $push: { history: [{role: "user", content: req.body.prompt}, {role: "assistant", content: stable_xl_data, type: req.body.type, size: req.body.size }] }},
          { new: true, useFindAndModify: false }
        );
        await img_Data.save();
        res.status(200).json({ data:stable_xl_data, id: req.body.id, type: req.body.type, size: req.body.size })
      })
    }

  }

  async Stable_Diffusion_Two (req, res) {
    
    console.log('stable diffusion 2 start', req.body.size);
    let file_name = "";
    let file_path = "";

    if (req.body.id == "") {
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({
        model: 'stabilityai/stable-diffusion-2-1',
        prompt: req.body.prompt,
        n: 4,
      }).then(async (data) => {
        let stable_xl_data = []
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        const img = new imgHistory({
          user_id: req.body.userID,
          prompt: req.body.prompt,
          type: req.body.type,
          history: [[{ role: "user", content: req.body.prompt }, { role: "assistant", content: stable_xl_data, type: req.body.type, size: req.body.size }]]
        });
        let img_data = await img.save();
        const objectId = new mongoose.Types.ObjectId(img_data._id);
        const objectIdString = objectId.toString();
        res.status(200).json({ data: stable_xl_data, id: objectIdString, date: img_data.createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) })
      })
    } else {
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({
        model: 'stabilityai/stable-diffusion-2-1',
        prompt: req.body.prompt,
        n: 4,
      }).then(async (data) => {
        let stable_xl_data = []
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        let img_Data = await imgHistory.findOneAndUpdate(
          { _id: new ObjectId(req.body.id) },   
          { $push: { history: [{role: "user", content: req.body.prompt}, {role: "assistant", content: stable_xl_data, type: req.body.type, size: req.body.size}] }},
          { new: true, useFindAndModify: false }
        );
        await img_Data.save();
        res.status(200).json({ data: stable_xl_data, id: req.body.id, type: req.body.type })
      })
    }

  }

  async getImgSideData(req, res) {
    console.log('img side get data start')
    let historyData = []
    const dat = new Date().toLocaleDateString();
    imgHistory.find({user_id: req.body.id}).then(user => {
      console.log(user)
      user.map((data) => {
        const newItem = {
          id: data._id,
          title: data.prompt,
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
    })
  }

  async getImageDataByID(req, res) {
    imgHistory.find({_id: new ObjectId(req.params.id)}).then(users => {
      console.log('@#@#@#@#@#@#@#@#', users[0])
      return res.status(200).json({ data: users[0]})
    }).catch(err => {
      console.error(err);
    });
  }

  async getType (req, res) {
    let data = await imgHistory.findOne({ _id: new ObjectId(req.body.historyID)})
    let typeData = []
    data.history[req.body.id].map((item) => {
      if(item.type != null)
        typeData.push(item.type)
    })
    res.status(200).json({data: typeData})
  }

  async Summarize (req, res) {
    console.log("summarize start ##################", req.body);
    if (req.body.new_type == "DALL-E") {
      let dall_e_data = []
      const image = await Dall_E.images.generate({
        model: "dall-e-2", 
        response_format: "b64_json",
        prompt: req.body.prompt,
        n: 4
      });
      for (let i = 0; i < 4; i++) {
        const imageBuffer = Buffer.from(image.data[i].b64_json, 'base64');
        let file_name = `${uuidv4()}.png`;
        const savePath = path.join(__dirname, '../../../uploads', file_name);
        fs.writeFileSync(savePath, imageBuffer);
        let file_path = `https://onespot.ai/file/${file_name}`;
        dall_e_data.push({url: file_path})
      }
      let doc = await imgHistory.findOne({ _id: new ObjectId(req.body.id)})
        console.log(doc.history)
        let harray = doc.history
        doc.history[req.body.number].push({ role: "assistant", content: dall_e_data, type: req.body.new_type})
        await imgHistory.updateOne(
          { _id: new ObjectId(req.body.id) },
          { $set: { history: harray } }
        );
        return res.status(200).json({ data: dall_e_data})
    } else if (req.body.new_type == "Stable Diffusion XL") {
      console.log("stable diffux xl new generate", req.body.size)
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: req.body.prompt,
        n: 4,
        size: req.body.size
      }).then(async (data) => {
        let stable_xl_data = []
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          let file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          let file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        let doc = await imgHistory.findOne({ _id: new ObjectId(req.body.id)})
        console.log(doc.history)
        let harray = doc.history
        doc.history[req.body.number].push({ role: "assistant", content: stable_xl_data, type: req.body.new_type, size: req.body.size})
        await imgHistory.updateOne(
          { _id: new ObjectId(req.body.id) },
          { $set: { history: harray } }
        );
        return res.status(200).json({ data: stable_xl_data, size: req.body.size})
      })
    } else if (req.body.new_type == "Stable Diffusion 2") {
      console.log("stable diffu 2 new generate", req.body.size)
      sdk.auth(process.env.STABLE_DIFFUSION_XL);
      sdk.completions({ 
        model: 'stabilityai/stable-diffusion-2-1',
        prompt: req.body.prompt,
        n: 4,
        size: req.body.size
      }).then(async (data) => {
        let stable_xl_data = []
        for (let i = 0; i < 4 ; i++) {
          const imageBuffer = Buffer.from(JSON.parse(data.data).choices[i].image_base64, 'base64');
          let file_name = `${uuidv4()}.png`;
          const savePath = path.join(__dirname, '../../../uploads', file_name);
          fs.writeFileSync(savePath, imageBuffer);
          let file_path = `https://onespot.ai/file/${file_name}`;
          stable_xl_data.push({url: file_path})
        }
        let doc = await imgHistory.findOne({ _id: new ObjectId(req.body.id)})
        console.log(doc.history)
        let harray = doc.history
        doc.history[req.body.number].push({ role: "assistant", content: stable_xl_data, type: req.body.new_type, size: req.body.size})
        await imgHistory.updateOne(
          { _id: new ObjectId(req.body.id) },
          { $set: { history: harray } }
        );
        return res.status(200).json({ data: stable_xl_data, size: req.body.size})
      })
    }
  }

}

module.exports = new ImageGenerateController();