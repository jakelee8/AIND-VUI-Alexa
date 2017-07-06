'use strict';

const Alexa = require('alexa-sdk');
const facts = require('./facts');

const APP_ID = null;  // can be replaced with your app ID if publishing
const GET_FACT_MESSAGE = [
  "Here's your fact: ",
  "Let's see. ",
  'Hmm. ',
  'OK. ',
  ''
];

const NO_FACT_YEAR = [
  "Sorry, I don't have any facts for {}, but",
  "I don't know that anything happened in film history in {}, but",
  'Hmm. I have nothing for {}, but '
];

const NO_FACT = [
  "Sorry, I don't have any facts.",
  'Hmm. I have nothing right now.'
];

const MISSING_YEAR = [
  'For what year?',
  'What year did you want a fact for?',
  "I'm sorry, for what year did you want a fact?"
];

const HELP_EXAMPLE = [
  'a fact',
  'give me a fact',
  'give me information',
  'give me something',
  'tell me a fact',
  'tell me information',
  'what do you know about films'
];

// Test hooks - do not remove!
exports.GetFactMsg = GET_FACT_MESSAGE;
const APP_ID_TEST = 'mochatest';  // used for mocha tests to prevent warning
// end Test hooks

/*
  TODO (Part 2) add messages needed for the additional intent
  TODO (Part 3) add reprompt messages as needed
*/

const languageStrings = {
  'en': {
    'translation': {
      'FACTS': facts.FACTS_EN,
      'SKILL_NAME': 'Film History Facts',
      'GET_FACT_MESSAGE': GET_FACT_MESSAGE,
      'NO_FACT': NO_FACT,
      'NO_FACT_YEAR': NO_FACT_YEAR,
      'MISSING_YEAR': MISSING_YEAR,
      'HELP_MESSAGE':
          'You can say tell me a fact, or, you can say exit... What can I help you with?',
      'HELP_REPROMPT': 'You can ask for a fact by saying: ',
      'HELP_EXAMPLE': HELP_EXAMPLE,
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

const handlers = {
  'LaunchRequest': function () {
    this.emit('AMAZON.HelpIntent');
  },

  'GetNewFactIntent': function () {
    this.emit('GetFact');
  },

  'GetFact': function () {
    let msg = new Messages(this);

    // Get a random fact from the facts list
    let fact = msg.fact();

    // Create speech output
    let factSpeech = msg.getFact(fact);
    let help = msg.help();
    let speechOutput = '<p>' + factSpeech + '</p><p>' + help + '</p>';
    let reprompt = msg.reprompt();
    let skillName = this.t('SKILL_NAME');

    this.emit(':askWithCard', speechOutput, reprompt, skillName, fact);
  },

  'GetNewYearFactIntent': function () {
    let msg = new Messages(this);
    let year = this.event.request.intent.slots.FACT_YEAR.value;

    // Prompt for year, though GetNewFactIntent will be matched if no year
    // is provided.
    if (!year) {
      let speechOutput = msg.missingYear();
      let reprompt = msg.missingYear();
      let intent = this.event.request.intent;
      this.emit(':elicitSlot', 'FACT_YEAR', speechOutput, reprompt, intent);
      return;
    }

    // Filter facts by year
    let facts = this.t('FACTS');
    let yearFacts = facts.filter(function (it) {
      return it.indexOf(year) >= 0;
    });

    // Get response
    let fact, speechOutput;
    if (!yearFacts.length) {
      // No fact for year, provide random fact.
      let noFact = msg.noFactYear(year);
      fact = msg.fact();
      speechOutput = noFact + ' ' + fact;
    } else {
      // Get a random fact from the facts list
      fact = choice(yearFacts);
      speechOutput = msg.getFact(fact);
    }

    // Create speech output
    let help = msg.help();
    let reprompt = msg.reprompt();
    let skillName = this.t('SKILL_NAME');
    speechOutput = '<p>' + speechOutput + '</p><p>' + help + '</p>';
    this.emit(':askWithCard', speechOutput, reprompt, skillName, fact);
  },

  'AMAZON.HelpIntent': function () {
    let msg = new Messages(this);
    let speechOutput = msg.help();
    let reprompt = msg.help();
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
  let alexa = Alexa.handler(event, context);

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
 * Helper class for generating messages.
 */
class Messages {

  /**
   * Constructor.
   *
   * @param {Object} self Alexa this value in handler context.
   */
  constructor(self) {
    this.t = self.t.bind(self);
  }

  /**
   * Get random fact.
   *
   * @return {string}
   */
  fact () {
    return choice(this.t('FACTS'));
  }

  /**
   * Get random fact with prefix.
   *
   * @param {string} [fact] The fact to prefix with an intro or get a random
   *   fact if undefined.
   * @return {string}
   */
  getFact(fact) {
    if (!fact) fact = this.fact();
    return choice(this.t('GET_FACT_MESSAGE')) + fact;
  }

  /**
   * Get missing year message.
   *
   * @return {string}
   */
  missingYear() {
    return choice(this.t('MISSING_YEAR'));
  }

  /**
   * Get no facts for year message.
   *
   * @param {number} year
   * @return {string}
   */
  noFactYear(year) {
    return choice(this.t('NO_FACT_YEAR')).replace('{}', year);
  }

  /**
   * Get help message.
   *
   * @return {string}
   */
  help() {
    return this.t('HELP_MESSAGE');
  }

  /**
   * Get reprompt mesage.
   *
   * @return {string}
   */
  reprompt() {
    return this.t('HELP_REPROMPT') + choice(this.t('HELP_EXAMPLE'));
  }
}

/**
 * Choose a random item from the array.
 *
 * @param {Array} arr The array
 * @return {any} The item
 */
function choice (arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
