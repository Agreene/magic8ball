/**
 * Assert that an error is thrown when a function is called.
 *
 * @param {function} promise - Function that is expected to throw an error
 *
 * https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
 */
exports.expectThrow = async promise => {
  try {
    await promise;

 } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(invalidOpcode || outOfGas || revert, "Expected throw, got '" + error + "' instead");
    return;
  }
  assert.fail('Expected throw not received');
};

/**
 * Assert that a Solidity event is emitted.
 *
 * @param {object} event         - JS object representing a Solidity event
 * @param {object} args          - JS object representing Solidity event args
 * @param {function} assertEqual - assertion to be called on expected & actual args
 * @param {int} timeout
 */
exports.assertEvent = (
  event, args,
  assertEqual = exports.assertEventArgs,
  timeout = 3000
) => {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error('Timeout while waiting for event'));
    }, timeout);

    event.watch((error, response) => {
      try {
        assertEqual(response.args, args, 'Event argument mismatch');
        resolve(response);
      } finally {
        clearTimeout(t);
        event.stopWatching();
      }
    });
  });
};

/**
 * Assert function used to match Solidity event args.
 * Iterates through event args and calls `valueOf()` to get JS values
 *
 * @param {object} actual   - actual event args
 * @param {object} expected - expected event args
 */
exports.assertEventArgs = (actual, expected) => {
  for (var k in expected) {
    assert.deepEqual(
      actual[k].valueOf(),
      expected[k],
      "Event arg value mismatch for '" + k + "'"
    );
  }
};