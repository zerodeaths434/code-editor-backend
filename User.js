const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("CodeEditorUser", UserSchema);
