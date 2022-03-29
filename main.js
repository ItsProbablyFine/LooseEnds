/// stub sim

const allEventSpecs = [
  {eventType: "getCoffeeWith", tags: ["friendly"]},
  {eventType: "physicallyAttack", tags: ["unfriendly", "harms", "major"]},
  {eventType: "disparagePublicly", tags: ["unfriendly", "harms"]},
  {eventType: "declareRivalry", tags: ["unfriendly"]},
  {eventType: "sendPostcard", tags: ["friendly"]},
  {eventType: "insult", tags: ["unfriendly"]},
  {eventType: "insultDismissively", tags: ["unfriendly", "highStatus"]},
  {eventType: "rejectSuperiority", tags: ["unfriendly", "lowStatus"]},
  {eventType: "flirtWith_accepted", tags: ["romantic", "positive"]},
  {eventType: "flirtWith_rejected", tags: ["romantic", "negative", "awkward"]},
  {eventType: "askOut_accepted", tags: ["romantic", "positive", "major"]},
  {eventType: "askOut_rejected", tags: ["romantic", "negative", "awkward", "major"]},
  {eventType: "propose_accepted", tags: ["romantic", "positive", "major"]},
  {eventType: "propose_rejected", tags: ["romantic", "negative", "awkward", "major"]},
  {eventType: "breakUp", tags: ["romantic", "negative", "major"]},
  {eventType: "buyLunchFor", tags: ["friendly"]},
  {eventType: "inviteIntoGroup", tags: ["highStatus", "friendly", "helps"]},
  {eventType: "shunFromGroup", tags: ["highStatus", "unfriendly", "harms"]},
  {eventType: "apologizeTo", tags: ["friendly"]},
  {eventType: "begForFavor", tags: ["lowStatus"]},
  {eventType: "extortFavor", tags: ["highStatus"]},
  {eventType: "callInFavor", tags: ["highStatus"]},
  {eventType: "callInExtortionateFavor", tags: ["highStatus", "harms"]},
  {eventType: "playTheFool", tags: ["lowStatus", "friendly"]},
  {eventType: "playRoyalty", tags: ["highStatus", "friendly"]},
  {eventType: "neg", tags: ["highStatus", "romantic", "negative"]},
  {eventType: "askForHelp", tags: ["lowStatus", "friendly"]},
  {eventType: "deferToExpertise", tags: ["career", "lowStatus"]},
  {eventType: "noticeMeSenpai", tags: ["lowStatus", "romantic"]},
  {eventType: "deliberatelySabotage", tags: ["career", "unfriendly", "harms", "major"]},
  {eventType: "collab:phoneItIn", tags: ["career", "harms"]},
  {eventType: "collab:goAboveAndBeyond", tags: ["career", "helps"]},
];

function getAllCharIDs(db) {
  return datascript.q(`[:find ?c :where [?c "type" "char"]]`, db);
}

function getAllCharIDPairs(db) {
  return datascript.q(`[:find ?c1 ?c2
                        :where [?c1 "type" "char"] [?c2 "type" "char"] [(not= ?c1 ?c2)]]`, db);
}

function getAllPossibleActions(db) {
  const allPossibleActions = [];
  const charIDPairs = getAllCharIDPairs(db);
  for (const eventSpec of allEventSpecs) {
    for (const [c1, c2] of charIDPairs) {
      allPossibleActions.push({
        type: "event",
        eventType: eventSpec.eventType,
        tags: eventSpec.tags,
        actor: c1,
        target: c2
      });
    }
  }
  return allPossibleActions;
}

// Add an event to the DB and return an updated DB.
function addEvent(db, event) {
  const transaction = [[":db/add", -1, "type", "event"]];
  for (let attr of Object.keys(event)) {
    if (attr === "tags") continue;
    transaction.push([":db/add", -1, attr, event[attr]]);
  }
  for (let tag of event.tags) {
    transaction.push([":db/add", -1, "tag", tag]);
  }
  return datascript.db_with(db, transaction);
}

const schema = {
  tag: {":db/cardinality": ":db.cardinality/many"}
};

const allCharNames = [
  "Aaron", "Bella", "Cam", "Devin", "Emily",
  // spare names if we need extra
  "Adam", "Alex", "Alice", "Ann",
  "Ben", "Beth",
  "Cathy", "Colin",
  "Emma", "Erin",
  "Fred",
  "Gavin", "Gillian",
  "Izzy",
  "Jacob", "James", "Janey", "Jason", "Jordan",
  "Kevin", "Kurt",
  "Liz",
  "Matt", "Melissa",
  "Nathan", "Nicole", "Nora",
  "Quinn",
  "Robin",
  "Sarah",
  "Victor", "Vincent"
];

function initializeDB() {
  let db = datascript.empty_db(schema);
  for (let i = 0; i < 5; i++) {
    const charName = allCharNames[i];
    const transaction = [
      [":db/add", -1, "type", "char"],
      [":db/add", -1, "name", charName],
    ];
    db = datascript.db_with(db, transaction);
  }
  return db;
}


/// UI state management

let appState = {
  db: initializeDB(),
  goals: [
    `(pattern establishRivalry
       (event ?e1 where tag: unfriendly, actor: ?c1, target: ?c2)
       (event ?e2 where tag: unfriendly, actor: ?c2, target: ?c1)
       (event ?e3 where eventType: declareRivalry, actor: ?c1, target: ?c2))`
  ],
  suggestions: [],
  suggestionsCursor: 0,
  transcriptEntries: [{title: "Foo", text: "Bar"}],
};

function initAppState() {
  for (let i = 0; i < appState.goals.length; i++) {
    const rawGoal = appState.goals[i];
    const compiledGoal = compilePattern(parse(rawGoal)[0]);
    appState.goals[i] = compiledGoal;
  }
}

initAppState();

function refreshSuggestions() {
  const allSuggestions = getAllPossibleActions(appState.db);
  for (const suggestion of allSuggestions) {
    const nextDB = addEvent(appState.db, suggestion);
    suggestion.db = nextDB;
  }
  // TODO sort by whether/how each suggestion advances active goals
  // (this part is gonna be complicated i think)
  appState.suggestions = allSuggestions;
  appState.suggestionsCursor = 0;
}

function applyUIEffect(effect, params) {
  // transcript UI effects
  if (effect === "updateTranscriptEntryText") {
    appState.transcriptEntries[params.entry].text = params.newText;
  }

  // suggestion UI effects
  else if (effect === "pickSuggestion") {
    console.warn("Unimplemented UI effect type", effect);
    // identify which suggestion we're trying to perform
    const suggestion = appState.suggestions[params.suggestion];
    // perform it, updating the DB with the resulting effects and new event
    appState.db = suggestion.db;
    // add a new transcript entry for the new event
    const latestEventID = newestEID(appState.db);
    const latestEvent = getEntity(appState.db, latestEventID);
    appState.transcriptEntries.push({
      title: `${latestEvent.actor} ${latestEvent.eventType} ${latestEvent.target}`,
      text: ""
    });
    // TODO update any goals that this suggestion advances/completes/cuts off
    // refresh suggestions based on new DB state
    refreshSuggestions();
  }
  else if (effect === "hoverSuggestion") {
    console.warn("Unimplemented UI effect type", effect);
    // identify which suggestion we're trying to perform
    const suggestion = appState.suggestions[params.suggestion];
    // TODO visually update any goals that would be advanced/completed/cut off by it
    // (might need to speculatively perform it for this to work?)
  }
  else if (effect === "unhoverSuggestion") {
    console.warn("Unimplemented UI effect type", effect);
    // TODO visually update any goals that are currently impacted by suggestion hover
  }
  else if (effect === "showMoreSuggestions") {
    // advance the suggestions cursor, wrapping around if we reach the end
    let nextCursor = appState.suggestionsCursor + 3;
    if (!appState.suggestions[nextCursor]) nextCursor = 0;
    appState.suggestionsCursor = nextCursor;
  }

  // TODO goal UI effects?

  // fallback: catch any attempts to invoke nonexistent UI effect types
  else {
    console.warn("Bad UI effect type", effect);
  }

  // at the end, rerender everything to reflect the updated app state
  rerenderUI(appState);
}


/// rendering

const e = React.createElement;

function rerenderUI(state) {
  // render transcript
  ReactDOM.render(
    state.transcriptEntries.map((entry, entryID) => {
      return e("div", {className: "entry", key: entryID},
        e("div", {className: "system-text"}, entry.title),
        e("textarea", {
          className: "user-text",
          onChange: ev => applyUIEffect(
            "updateTranscriptEntryText",
            {entry: entryID, newText: ev.target.value}
          ),
          value: entry.text
        })
      );
    }),
    document.getElementById("transcript")
  );

  // render suggested actions
  const cursor = state.suggestionsCursor;
  const suggestions = state.suggestions.slice(cursor, cursor + 3);
  ReactDOM.render(
    suggestions.map((suggestion, suggestionIdx) => {
      const absoluteSuggestionIdx = cursor + suggestionIdx;
      return e("div", {
          className: "suggestion",
          key: suggestionIdx,
          onClick: ev => applyUIEffect("pickSuggestion", {suggestion: absoluteSuggestionIdx}),
          onMouseEnter: ev => applyUIEffect("hoverSuggestion", {suggestion: absoluteSuggestionIdx}),
          onMouseLeave: ev => applyUIEffect("unhoverSuggestion", {})
        },
        `${suggestion.actor} ${suggestion.eventType} ${suggestion.target}`
      );
    }),
    document.getElementById("suggestions")
  );

  // render goals
  ReactDOM.render(
    appState.goals.map(goal => {
      console.log("goal", goal);
      return e("div", {className: "goal"},
        e("div", {className: "goal-title", key: -1}, goal.name),
        goal.eventClauses.map((clause, clauseIdx) => {
          return e("div", {className: "goal-part", key: clauseIdx}, clause.where.join(" "))
        })
      );
    }),
    document.getElementById("goals")
  );
}

function initiallyRenderUI(state) {
  // render the see-more-suggestions button
  ReactDOM.render(
    e("div", {
      onClick: ev => applyUIEffect("showMoreSuggestions", {})
    }, "see more..."),
    document.getElementById("suggestions-more")
  );

  // get the initial set of suggestions
  refreshSuggestions();

  // do a first render pass on all the dynamic UI bits too
  rerenderUI(state);
}

initiallyRenderUI(appState);
