const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");//因为这个模块是本地的，所以要在前面加__dirname

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

export default function handler(request, response) {
    response.status(200).json({
        body: request.body,
        query: request.query,
        cookies: request.cookies,
    });
}

//用mongoose取代这部分
// let items = [];//先定义这个变量，代码先运行到app.get()那段才不会报错
// let workItems = [];
main().catch(err => {
    console.log(err);
});

async function main() {
    //await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
    await mongoose.connect("mongodb+srv://fx:3373380mongodb@cluster0.ewlt8jq.mongodb.net/todolistDB?retryWrites=true&w=majority");

    const itemsSchema = new mongoose.Schema({
        name: String
    });
    const Item = mongoose.model("Item", itemsSchema);
    const item1 = new Item ({
        name: "Welcome to your todolist!"
    });
    const item2 = new Item ({
        name: "Hit the + button to add a new item."
    });
    const item3 = new Item ({
        name: "<--Hit this to delete item."
    });
    const defalutItems = [item1, item2, item3];
    const foundItems = await Item.find();
    if(foundItems.length === 0) {
        await Item.insertMany(defalutItems);
    }
    //只有在没有item的时候才插入默认值

    const listsSchema = new mongoose.Schema({
        name: String,
        items: [itemsSchema] //以itemsSchema为一个项构成的一个数组
    });
    const List = mongoose.model("List", listsSchema);


    app.get("/", function(req, res){
        res.render("list", {listTitle: "Today", newListItem: foundItems});
    });
    
    //要用await必须要在函数前加async，对find来说在后面加.exec()或.then()返回的是promise而不是数据，所以这里必须要用await
    app.get("/:listName", async function(req, res){
        const listName  = _.capitalize(req.params.listName);
        //用find之后的length检查是否存在
        // const foundList = await List.find({name: listName});
        // if(foundList.length == 0) {
        //     const currentList = new List({
        //         name: listName,
        //         items: defalutItems
        //     });
        //     currentList.save();
        // }
        //或者这一段可以用findOne检查
        const foundList = await List.findOne({name: listName});
        if(!foundList) {
            const currentList = new List({
                name: listName,
                items: defalutItems
            });
            currentList.save();
            res.redirect("/" + listName);
        } else {
            res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
        }
        //foundList.items是一个由itemsSchema组成的数组，所以传递到list.ejs依然有name属性
        //这里必须写一个if-else逻辑是因为如果之前没有创建过这个list，那么找到的foundList是空的，就无法在render里面传递数据
        //但如果render里面用的是currentList，那么如果之前创建过这个list，无法显示之前已经有的内容 
    });
    
    app.get("/about", function(req, res){
        res.render("about");
    });

    app.post("/", async function(req, res){
        const listItem = req.body.newItem;
        const listTitle = req.body.list;//需要这个信息知道是从哪个页面发送来的表单
        const item = new Item({
            name: listItem
        });
        if(listTitle === "Today") {
            foundItems.push(item);
            item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({name: listTitle});
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listTitle);
        }
    });

    
    app.post("/delete", async function(req, res){
        const listTitle = req.body.list;
        console.log(listTitle);
        const checkedItemID = req.body.checkbox; //req.body.checkbox：checkbox是复选框的name，这个name为checkbox的复选框的value就是_id
        console.log(checkedItemID);
        if(listTitle === 'Today') {
            Item.findByIdAndRemove(checkedItemID).exec();
            foundItems.forEach(function(item, index){
                if(item.id === checkedItemID) {
                    foundItems.splice(index, 1);
                }
            });
            res.redirect("/");
        } else {
            await List.findOneAndUpdate({name:  listTitle}, {$pull: {items: {_id: checkedItemID}}});//找到对应name的那个list，在items这个数组里面删除特定id的那项
            //const foundList = await List.findOne({name: listTitle});
            // const listItems = foundList.items;
            // listItems.forEach(function(item, index){
            //     if(item.id === checkedItemID) {
            //         listItems.splice(index, 1);
            //         List.updateOne({name: listTitle}, {items: listItems}).exec();
            //     }
            // });
            res.redirect("/" + listTitle);
        }
    });
}


app.listen(3000, function(){
    console.log("Server is running on 3000");
});