/// stub sim

const basicSoloEventSpecs = [
  {eventType: "beginMajorWork", tags: ["artistic", "major"]}
];

const basicDyadicEventSpecs = [
  {eventType: "getCoffeeWith", tags: ["friendly"]},
  //{eventType: "physicallyAttack", tags: ["unfriendly", "harms", "major"]},
  {eventType: "disparagePublicly", tags: ["unfriendly", "harms"]},
  {eventType: "sendPostcard", tags: ["friendly"]},
  {eventType: "insult", tags: ["unfriendly"]},
  {eventType: "insultDismissively", tags: ["unfriendly", "highStatus"]},
  {eventType: "rejectSuperiority", tags: ["unfriendly", "lowStatus"]},
  {eventType: "flirtWith_accepted", tags: ["romantic", "positive"]},
  {eventType: "flirtWith_rejected", tags: ["romantic", "negative", "awkward"]},
  //{eventType: "askOut_accepted", tags: ["romantic", "positive", "major"]},
  //{eventType: "askOut_rejected", tags: ["romantic", "negative", "awkward", "major"]},
  //{eventType: "propose_accepted", tags: ["romantic", "positive", "major"]},
  //{eventType: "propose_rejected", tags: ["romantic", "negative", "awkward", "major"]},
  //{eventType: "breakUp", tags: ["romantic", "negative", "major"]},
  {eventType: "buyLunchFor", tags: ["friendly"]},
  {eventType: "inviteIntoGroup", tags: ["highStatus", "friendly", "helps"]},
  {eventType: "shunFromGroup", tags: ["highStatus", "unfriendly", "harms"]},
  {eventType: "apologizeTo", tags: ["friendly"]},
  {eventType: "begForFavor", tags: ["lowStatus"]},
  {eventType: "extortFavor", tags: ["highStatus"]},
  {eventType: "callInFavor", tags: ["highStatus"]},
  {eventType: "callInExtortionateFavor", tags: ["highStatus", "harms"]},
  //{eventType: "playTheFool", tags: ["lowStatus", "friendly"]},
  //{eventType: "playRoyalty", tags: ["highStatus", "friendly"]},
  //{eventType: "neg", tags: ["highStatus", "romantic", "negative"]},
  {eventType: "askForHelp", tags: ["lowStatus", "friendly"]},
  {eventType: "deferToExpertise", tags: ["career", "lowStatus"]},
  {eventType: "noticeMeSenpai", tags: ["lowStatus", "romantic"]},
  //{eventType: "collab:phoneItIn", tags: ["career", "harms"]},
  //{eventType: "collab:goAboveAndBeyond", tags: ["career", "helps"]},
];

const authorGoalTemplates = [
  {
    name: "establishGrudge",
    pattern:
    `(pattern establishGrudge
       (event ?e1 where tag: unfriendly, actor: ?c2, target: ?c1)
       (event ?e2 where eventType: formGrudge, actor: ?c1, target: ?c2))`,
    stages: [
      "?c2 is unfriendly to ?c1",
      "?c1 forms a grudge on ?c2"
    ]
  },
  {
    name: "majorWork",
    pattern:
    `(pattern majorWork
       (event ?e1 where eventType: beginMajorWork, actor: ?c1)
       (event ?e2 where eventType: makeProgressOnMajorWork, actor: ?c1)
       (event ?e3 where eventType: makeProgressOnMajorWork, actor: ?c1)
       (event ?e4 where eventType: makeProgressOnMajorWork, actor: ?c1)
       (event ?e5 where eventType: finishMajorWork, actor: ?c1))`,
    stages: [
      "?c1 begins a major work",
      "?c1 makes progress on the work",
      "?c1 makes more progress",
      "?c1 makes even more progress",
      "?c1 finishes the work"
    ]
  },
  {
    name: "onARoll",
    pattern:
    `(pattern onARoll
       (event ?e1 where eventType: finishMajorWork, actor: ?c1)
       (event ?e2 where eventType: finishMajorWork, actor: ?c1)
       (unless-event ?e3 where eventType: finishMajorWork, actor: ?c2, (not= ?c1 ?c2)))`,
    stages: [
      "?c1 finishes a major work",
      "?c1 finishes another major work"
      //"?c2 finishes a major work first"
    ]
  }
];

function getAllCharIDs(db) {
  return datascript.q(`[:find ?c :where [?c "type" "char"]]`, db).map(res => res[0]);
}

function getAllCharIDPairs(db) {
  return datascript.q(`[:find ?c1 ?c2
                        :where [?c1 "type" "char"] [?c2 "type" "char"] [(not= ?c1 ?c2)]]`, db);
}

function getCharName(db, id) {
  return datascript.q(`[:find ?n . :where [${id} "type" "char"] [${id} "name" ?n]]`, db);
}

function generatePossibleActions(goal) {
  if (goal.pattern.name === "majorWork" && goal.bindings["?c1"]) {
    if (goal.abandoned) {
      return [{
        eventType: "resumeMajorWork",
        actor: goal.bindings["?c1"],
        tags: ["artistic", "positive", "minor"]
      }];
    }
    else if (!goal.bindings["?e1"]) {
      const enabledActions = [];
      const possibleActors = goal.bindings["?c1"]
        ? [goal.bindings["?c1"]]
        : getAllCharIDs(appState.db);
      for (const charID of possibleActors) {
        enabledActions.push({
          eventType: "beginMajorWork",
          actor: charID,
          tags: ["artistic", "major"]
        });
      }
      return enabledActions;
    }
    else if (!goal.bindings["?e5"]) {
      const enabledActions = [
        /*{
          eventType: "abandonMajorWork",
          actor: goal.bindings["?c1"],
          tags: ["artistic", "negative", "major"]
        },*/
        {
          eventType: "makeProgressOnMajorWork",
          actor: goal.bindings["?c1"],
          tags: ["artistic", "positive", "minor"]
        },
        {
          eventType: "worryAboutMajorWork",
          actor: goal.bindings["?c1"],
          tags: ["worry", "artistic", "negative", "minor"]
        },
        {
          eventType: "complainAboutMajorWork",
          actor: goal.bindings["?c1"],
          tags: ["complain", "artistic", "negative", "minor"]
        }
      ];
      if (goal.bindings["?e4"]) {
        enabledActions.push({
          eventType: "finishMajorWork",
          actor: goal.bindings["?c1"],
          tags: ["artistic", "positive", "major"]
        });
      }
      return enabledActions;
    }
    else {
      return [];
    }
  }
  else if (goal.pattern.name === "establishGrudge") {
    if (goal.bindings["?e1"] && !goal.bindings["?e2"]) {
      return [{
        eventType: "formGrudge",
        actor: goal.bindings["?c1"],
        target: goal.bindings["?c2"],
        tags: ["negative", "major"]
      }];
    }
    else if (goal.bindings["?e2"]) {
      const enabledActions = [
        {eventType: "sabotage", tags: ["career", "unfriendly", "harms", "major"]},
        {eventType: "complainAboutGrudge", tags: ["complain", "negative", "minor"]},
        {eventType: "worryAboutGrudge", tags: ["worry", "negative", "minor"]},
      ];
      enabledActions.forEach(template => {
        template.actor = goal.bindings["?c1"];
        template.target = goal.bindings["?c2"];
      });
      return enabledActions;
    }
    else {
      return [];
    }
  }
  else {
    return [];
  }
}

function getAllPossibleActions(appState) {
  const allPossibleActions = [];
  const charIDs = getAllCharIDs(appState.db);
  const charIDPairs = getAllCharIDPairs(appState.db);
  for (const eventSpec of basicSoloEventSpecs) {
    for (const c of charIDs) {
      allPossibleActions.push({
        type: "event",
        eventType: eventSpec.eventType,
        tags: eventSpec.tags,
        actor: c
      });
    }
  }
  for (const eventSpec of basicDyadicEventSpecs) {
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
  for (const goal of appState.goals) {
    for (const actionTemplate of generatePossibleActions(goal)) {
      actionTemplate.type = "event";
      actionTemplate.goal = goal.id;
      allPossibleActions.push(actionTemplate);
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
  for (let tag of event.tags || []) {
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

const firstFiveChars = allCharNames.slice(0, 5);
const allValues = ["cuteness", "humor", "minimalism", "radicalism", "seriousness", "sincerity"];
let appState = {
  db: initializeDB(),
  initialCharSituations: firstFiveChars.map(char => {
    const doesValue = randNth(allValues);
    const doesntValue = randNth(allValues.filter(v => v !== doesValue));
    //const likeTarget = randNth(firstFiveChars.filter(tc => tc !== char));
    //const dislikeTarget = randNth(firstFiveChars.filter(tc => tc !== char && tc !== likeTarget));
    return {
      name: char,
      situations: [
        randNth(["wowchair", "firebrand", "slacker", "sycophant", "worrier"]),
        "appreciates " + doesValue,
        "despises " + doesntValue
        //"likes " + likeTarget,
        //"dislikes " + dislikeTarget
      ]
    };
  }),
  goals: [],
  nextAuthorGoalID: 0,
  suggestions: [],
  suggestionsCursor: 0,
  transcriptEntries: [],
};

function initAppState() {
  for (const goalName of ["establishGrudge", "majorWork"]) {
    addAuthorGoal(appState, goalName);
  }
}

initAppState();

function refreshSuggestions() {
  const allSuggestions = shuffle(getAllPossibleActions(appState));
  for (const suggestion of allSuggestions) {
    const nextDB = addEvent(appState.db, suggestion);
    suggestion.db = nextDB;
    // figure out how this suggestion would update author goals if accepted
    // (TODO unify this logic with the logic used below in the pickSuggestion UI effect handler)
    suggestion.goalUpdates = [];
    const latestEventID = newestEID(suggestion.db);
    for (const goal of appState.goals) {
      const possibleGoalUpdates = tryAdvance(goal, suggestion.db, "", latestEventID);
      suggestion.goalUpdates = suggestion.goalUpdates.concat(possibleGoalUpdates);
    }
  }
  // Sort by whether/how each suggestion advances active goals,
  // and secondarily by whether each suggestion is enabled by an active goal
  // (even if it doesn't advance any goals). FIXME Improve this.
  allSuggestions.sort((a, b) => {
    const bScore = b.goalUpdates.length + (b.goal ? 0.5 : 0);
    const aScore = a.goalUpdates.length + (a.goal ? 0.5 : 0);
    return bScore - aScore;
  });
  appState.suggestions = allSuggestions;
  appState.suggestionsCursor = 0;
}

function getAuthorGoal(appState, goalID) {
  return appState.goals.find(goal => goal.id === goalID);
}

function addAuthorGoal(appState, goalName) {
  const goalTemplate = authorGoalTemplates.find(agt => agt.name === goalName);
  const compiledPattern = compilePattern(parse(goalTemplate.pattern)[0]);
  appState.goals.push({id: appState.nextAuthorGoalID, pattern: compiledPattern, bindings: {}});
  appState.nextAuthorGoalID += 1;
}

function removeAuthorGoal(appState, goalID) {
  appState.goals = appState.goals.filter(goal => goal.id !== goalID);
}

function applyUIEffect(effect, params) {
  // transcript UI effects
  if (effect === "updateTranscriptEntryText") {
    appState.transcriptEntries[params.entry].text = params.newText;
  }

  // suggestion UI effects
  else if (effect === "pickSuggestion") {
    // identify which suggestion we're trying to perform
    const suggestion = appState.suggestions[params.suggestion];
    // perform it, updating the DB with the resulting effects and new event
    appState.db = suggestion.db;
    // add a new transcript entry for the new event
    const latestEventID = newestEID(appState.db);
    const latestEvent = getEntity(appState.db, latestEventID);
    const actorName = getCharName(appState.db, suggestion.actor);
    const targetName = suggestion.target ? getCharName(appState.db, suggestion.target) : "";
    appState.transcriptEntries.push({
      title: `${actorName} ${latestEvent.eventType} ${targetName}`.trim(),
      text: ""
    });
    // update any goals that this suggestion advances/completes/cuts off
    for (let i = 0; i < appState.goals.length; i++) {
      const goal = appState.goals[i];
      const possibleGoalUpdates = tryAdvance(goal, appState.db, "", latestEventID);
      console.log("possibleGoalUpdates", possibleGoalUpdates);
      const meaningfulUpdates = possibleGoalUpdates.filter(g => g.lastStep !== "pass");
      if (meaningfulUpdates.length > 0) {
        const prevGoalID = appState.goals[i].id;
        appState.goals[i] = meaningfulUpdates[0];
        appState.goals[i].id = prevGoalID;
      }
    }
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

  // goal UI effects
  else if (effect === "openGoalComposer") {
    appState.goalComposerActive = true;
  }
  else if (effect === "closeGoalComposer") {
    appState.goalComposerActive = false;
  }
  else if (effect === "addAuthorGoal") {
    addAuthorGoal(appState, params.name);
  }

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
  const transcriptEntriesDiv = document.getElementById("transcript-entries");
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
          placeholder: "Details here...",
          value: entry.text
        })
      );
    }),
    transcriptEntriesDiv
  );
  // ...and scroll most recent entry into view if there are any entries
  if (transcriptEntriesDiv.lastChild) {
    transcriptEntriesDiv.lastChild.scrollIntoView();
  }

  // render suggested actions
  const cursor = state.suggestionsCursor;
  const suggestions = state.suggestions.slice(cursor, cursor + 3);
  ReactDOM.render(
    suggestions.map((suggestion, suggestionIdx) => {
      const absoluteSuggestionIdx = cursor + suggestionIdx;
      const actorName = getCharName(state.db, suggestion.actor);
      const targetName = suggestion.target ? getCharName(state.db, suggestion.target) : "";
      return e("div", {
          className: "suggestion",
          key: suggestionIdx,
          onClick: ev => applyUIEffect("pickSuggestion", {suggestion: absoluteSuggestionIdx}),
          onMouseEnter: ev => applyUIEffect("hoverSuggestion", {suggestion: absoluteSuggestionIdx}),
          onMouseLeave: ev => applyUIEffect("unhoverSuggestion", {})
        },
        `${actorName} ${suggestion.eventType} ${targetName}`.trim()
      );
    }),
    document.getElementById("suggestions")
  );

  // render goals
  const goalElems = appState.goals.map(goal => {
    const firstIncompleteClauseIdx = goal.pattern.eventClauses.findIndex(
      ec => !hasBinding(goal, ec.eventLvar)
    );
    const goalTpl = authorGoalTemplates.find(agt => agt.name === goal.pattern.name);
    const friendlyBindings = {};
    for (const lvar of Object.keys(goal.bindings)) {
      const val = goal.bindings[lvar];
      if (Number.isInteger(val)) {
        const ent = getEntity(appState.db, val);
        friendlyBindings[lvar] = ent.name;
      } else {
        friendlyBindings[lvar] = val;
      }
    }
    const clauseElems = [];
    for (let clauseIdx = 0; clauseIdx < goal.pattern.eventClauses.length; clauseIdx++) {
      const clause = goal.pattern.eventClauses[clauseIdx];
      const complete = goal.lastStep === "complete" || clauseIdx < firstIncompleteClauseIdx;
      const stageDescTpl = goalTpl.stages[clauseIdx];
      let stageDesc = stageDescTpl;
      for (const lvar of Object.keys(friendlyBindings)) {
        stageDesc = stageDesc.replaceAll(lvar, friendlyBindings[lvar]);
      }
      clauseElems.push(e("div", {
        className: "goal-part" + (complete ? " complete" : ""),
        key: clauseIdx
      },
      stageDesc));
    }
    return e("div", {className: "goal"},
      e("div", {className: "goal-title", key: -1}, goal.pattern.name),
      clauseElems
    );
  });
  goalElems.push(e("div", {
    className: "add-goal",
    onClick: ev => applyUIEffect("openGoalComposer", {})
  }, "+"));
  ReactDOM.render(goalElems, document.getElementById("goals"));

  // render goal composer if active
  let goalComposer = null;
  if (state.goalComposerActive) {
    goalComposer = e("div", {
        className: "goal-composer-modal",
        onClick: ev => applyUIEffect("closeGoalComposer", {})
      },
      e("div", {className: "goal-composer"},
        e("h3", {}, "Add new author goal"),
        e("div", {className: "goal-template-picker"},
          authorGoalTemplates.map(agt => {
            return e("div", {
              className: "goal-template",
              onClick: ev => applyUIEffect("addAuthorGoal", {name: agt.name})
            },
            agt.name);
          })
        )
      )
    ),
    document.getElementById("goal-composer-modal");
  }
  ReactDOM.render(goalComposer, document.getElementById("goal-composer-modal"));
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

  // render the dramatis personae / initial character situations
  ReactDOM.render(
    state.initialCharSituations.map(char => {
      return e("span", {className: "char-situation"},
        e("span", {className: "char-name"}, char.name),
        ", ",
        char.situations.join(", "),
        e("br")
      );
    }),
    document.getElementById("dramatis-personae")
  );

  // do a first render pass on all the dynamic UI bits too
  rerenderUI(state);
}

initiallyRenderUI(appState);
