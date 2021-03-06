// Make a copy of the object.
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Create a DOM element from an HTML string.
function createNode(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstChild;
}

// modified from https://github.com/substack/node-concat-map/blob/master/index.js
function mapcat(xs, fn) {
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    var x = fn(xs[i], i);
    if (Array.isArray(x)) res.push.apply(res, x);
    else res.push(x);
  }
  return res;
}

// Return a random item from a list.
function randNth(items) {
  return items[Math.floor(Math.random()*items.length)];
}

// Return a shuffled copy of a list, leaving the original list unmodified.
function shuffle(items) {
  const newItems = [];
  for (let i = 0; i < items.length; i++) {
    newItems.push(items[i]);
  }
  for (let i = newItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
  }
  return newItems;
}

/// DataScript util functions

// Given the DB, return the EID of the most recently added entity.
function newestEID(db) {
  const allDatoms = datascript.datoms(db, ":eavt");
  return allDatoms[allDatoms.length - 1].e;
}

// Given the DB and an EID, retrieve the corresponding entity as an object.
// This is what `datascript.entity(db, eid)` SHOULD do, but for some reason doesn't.
function getEntity(db, eid) {
  let propValuePairs = datascript.q('[:find ?prop ?val :where [' + eid + ' ?prop ?val]]', db);
  if (propValuePairs.length === 0) return null;
  let entity = {':db/id': eid};
  for (let [prop, val] of propValuePairs) {
    entity[prop] = val;
  }
  return entity;
}
