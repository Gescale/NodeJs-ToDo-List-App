//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
let ejs = require("ejs");

const app = express();
//enable EJS to pass documents to html
app.set("view engine", "ejs");
//body-parser enable the passing of body contents to the Server
app.use(bodyParser.urlencoded({
  extended: true
}));
//using express to access static files such as css and images
app.use(express.static("public"));

//Mongoose creation of DBase todolistDB, and connection of DB and webApp
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//items listing BEGINING
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List!"
});

const item2 = new Item({
  name: "Hit the + button to create a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];
//end

//BEGINING list for dynamic routes
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);
//end

//BEGINING the home route
app.get("/", (req, res) => {
  //date implementation comented out

  //*******************************
  // let today = new Date();
  // let options = {
  //   weekday: "long",
  // }
  // let day = today.toLocaleDateString("en-US", options);

  Item.find({}, (err, results) => {
    if (results.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        FOO: "Today",
        itemList: results
      });
    }
  });
});
//end

//BEGINING the dynamic routes
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        res.render("list", {
          FOO: foundList.name,
          itemList: foundList.items
        });
      }
    }
  });

});
//end

//BEGINING the home route post handler
app.post("/", (req, res) => {
  const itemName = req.body.addToDo;
  const listName = req.body.button;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
//end

//BEGINING the checkbox delete handler
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err, feedBack) => {
      if (err) {
        console.log(err);
      } else {
        console.log(feedBack);
      }
      res.redirect("/");
    });

  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(err){
        console.log(err);
      }
      res.redirect("/" + listName);
    });
  }


});
//end

//declaration of the local host port number
app.listen(3000, () => {
  console.log("Server is running on port 3000!");
});
