/*
@exportId W5WySFJhTrShlR4lwMHiCQ
*/
module.exports = (function() {
class SlackUser {

  constructor(id, username) {
    this.id = id;
    this.username = username;
  }

  cellText() {
    return `${this.username} <@${this.id}>`
  }

  link() {
    return `<@${this.id}>`;
  }

  static fromCellText(cellText) {
    const match = /^\s*(@.+)\s<@(\w+)>\s*$/.exec(cellText);
    return match ? new SlackUser(match[2], match[1]) : null;
  }

}

return SlackUser;
})()
     