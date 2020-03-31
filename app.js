//jshint esversion:6

var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var _ = require("lodash");

var app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//local mode
/*mongoose.connect("mongodb://localhost:27017/todolistDB",
{useNewUrlParser: true,useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true});*/

mongoose.connect("mongodb+srv://Daniel-s:Dsc1023@cluster0-jsgfi.mongodb.net/todolistDB",
{useNewUrlParser: true,useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true});

mongoose.connection.on("error",(err)=>{
    console.log(err);
});

mongoose.connection.on("connected",(err,res) => {
    console.log("Mongoose is connected");
});

var itemsSchema = {
  name: String
};

var Item = mongoose.model("Item", itemsSchema);

var item1 = new Item({
  name: "Welcome to your todolist!"
});

var item2 = new Item({
  name: "Hit the + button to add a new item."
});

var item3 = new Item({
  name: "<-- Hit this to delete an item."
});

var defaultItems = [item1, item2, item3];

var listSchema = {
  name: String,
  items: [itemsSchema]
};

var List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){
  var customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        var list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  var itemName = req.body.newItem;
  var listName = req.body.list;

  var item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  var checkedItemId = req.body.checkbox;
  var listName = req.body.listName;

  if (listName === "Today") {
    Item.findOneAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on port 3000");
});
