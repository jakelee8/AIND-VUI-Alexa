'use strict';

var Alexa = require('alexa-sdk');
var facts = require('./facts');

var APP_ID;  // can be replaced with your app ID if publishing
var GET_FACT_MSG_EN = [
  "Here's your fact: ",
  "Let's see. ",
  'Hmm. ',
  'OK. ',
  ''
];

var NO_FACT_MSG_EN_YEAR = [
  "Sorry, I don't have any facts for {}, but",
  "I don't know that anything happened in film history in {}, but",
  'Hmm. I have nothing for {}, but '
];

var NO_FACT_MSG_EN = [
  "Sorry, I don't have any facts.",
  'Hmm. I have nothing right now.'
];

var MISSING_YEAR = [
  'For what year?',
  'What year did you want a fact for?',
  "I'm sorry, for what year did you want a fact?"
];

// Test hooks - do not remove!
exports.GetFactMsg = GET_FACT_MSG_EN;
var APP_ID_TEST = 'mochatest';  // used for mocha tests to prevent warning
// end Test hooks

/*
  TODO (Part 2) add messages needed for the additional intent
  TODO (Part 3) add reprompt messages as needed
*/
var languageStrings = {
  'en': {
    'translation': {
      'FACTS': facts.FACTS_EN,
      'SKILL_NAME': 'Film History Facts',  // OPTIONAL change this to a more descriptive name
      'GET_FACT_MESSAGE': GET_FACT_MSG_EN,
      'NO_FACT_MSG_EN': NO_FACT_MSG_EN,
      'NO_FACT_MSG_EN_YEAR': NO_FACT_MSG_EN_YEAR,
      'MISSING_YEAR': MISSING_YEAR,
      'HELP_MESSAGE': 'You can say tell me a fact, or, you can say exit... What can I help you with?',
      'HELP_REPROMPT': 'What can I help you with?',
      'STOP_MESSAGE': 'Goodbye!'
    }
  }
};

/*
  TODO (Part 2) add an intent for specifying a fact by year named 'GetNewYearFactIntent'
  TODO (Part 2) provide a function for the new intent named 'GetYearFact'
      that emits a randomized fact that includes the year requested by the user
      - if such a fact is not available, tell the user this and provide an alternative fact.
  TODO (Part 3) Keep the session open by providing the fact with :askWithCard instead of :tellWithCard
      - make sure the user knows that they need to respond
      - provide a reprompt that lets the user know how they can respond
  TODO (Part 3) Provide a randomized response for the GET_FACT_MESSAGE
      - add message to the array GET_FACT_MSG_EN
      - randomize this starting portion of the response for conversational variety
*/

var handlers = {
  'LaunchRequest': function () {
    this.emit('AMAZON.HelpIntent');
  },

  'GetNewFactIntent': function () {
    this.emit('GetFact');
  },

  'GetFact': function () {
    // Get a random fact from the facts list
    // Use this.t() to get corresponding language data
    var randomFact = choice(this.t('FACTS'));

    // Create speech output
    var speechOutput =
      '<p>' + choice(this.t('GET_FACT_MESSAGE')) + randomFact + '</p><p>' +
        this.t('HELP_MESSAGE') + '</p>';
    var reprompt = this.t('HELP_REPROMPT');
    var skillName = this.t('SKILL_NAME');

    this.emit(':askWithCard', speechOutput, reprompt, skillName, randomFact);
  },

  'GetNewYearFactIntent': function () {
    var speechOutput, randomFact, reprompt;

    // Filter facts by year
    var year = this.event.request.intent.slots.FACT_YEAR.value || '';

    // Prompt for year, though GetNewFactIntent will be matched if no year
    // is provided.
    if (!year) {
      var updatedIntent = this.event.request.intent;
      reprompt = choice(this.t('MISSING_YEAR'));
      speechOutput = choice(this.t('MISSING_YEAR'));
      this.emit(':elicitSlot', 'FACT_YEAR',
                speechOutput, reprompt, updatedIntent);
      return;
    }

    var facts = this.t('FACTS');
    var yearFacts = facts.filter(function (it) {
      return it.indexOf(year) >= 0;
    });

    // Get response
    if (!yearFacts.length) {
      // No fact for year, provide random fact.
      randomFact = choice(this.t('FACTS'));
      speechOutput =
        choice(this.t('NO_FACT_MSG_EN_YEAR')).replace('{}', year) +
          ' ' + randomFact;
    } else {
      // Get a random fact from the facts list
      randomFact = choice(yearFacts);
      speechOutput = choice(this.t('GET_FACT_MESSAGE')) + randomFact;
    }

    // Create speech output
    var skillName = this.t('SKILL_NAME');
    speechOutput = '<p>' + speechOutput + '</p><p>' +
      this.t('HELP_MESSAGE') + '</p>';
    reprompt = this.t('HELP_REPROMPT');
    this.emit(':askWithCard', speechOutput, reprompt, skillName, randomFact);
  },

  'AMAZON.HelpIntent': function () {
    var speechOutput = this.t('HELP_MESSAGE');
    var reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },

  'AMAZON.StopIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },

  'SessionEndedRequest': function () {
    // Use this function to clear up and save any data needed between sessions
    this.emit('AMAZON.StopIntent');
  },

  'Unhandled': function () {
    this.emit('AMAZON.HelpIntent');
  }
};

exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context);

  // set a test appId if running the mocha local tests
  alexa.APP_ID = APP_ID;
  if (event.session.application.applicationId == 'mochatest') {
    alexa.appId = APP_ID_TEST;
  }

  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

/**
 * Choose a random item from the array.
 *
 * @param {Array} arr The array
 * @return {any} The item
 */
function choice (arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
