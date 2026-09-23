'use strict';

const { handleForm } = require('./_lib/forms');

module.exports = (req, res) => handleForm(req, res, 'waitlist');
