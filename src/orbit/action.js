import Orbit from 'orbit/core';

var defineAction = function(object, name) {
  object[name] = function() {
    return performAction(
      object,
      name,
      arguments);
  };
};

var performAction = function(object, name, args) {
  var actions = object.poll('will' + Orbit.capitalize(name), args);
  actions.push(object['_' + name]);
  return performActions(false, actions, object, name, args);
};

var performActions = function(afterAction, actions, object, name, args) {
  var action = actions.shift();

  if (!action) {
    if (afterAction) {
      var Name = Orbit.capitalize(name);
      object.emit('didNot' + Name + ' after' + Name, arguments);
      throw new Error('Action could not be completed successfully');
    } else {
      // Notify listeners that the action was not successful, and provide
      // them with the chance to perform it as part of the same promise.
      actions = object.poll('rescue' + Orbit.capitalize(name), args);
      return performActions(true, actions, object, name, args);
    }
  }

  Orbit.assert("Action should be a function", typeof action === "function");

  return action.apply(object, args).then(
    function() {
      var Name = Orbit.capitalize(name);
      object.emit('did' + Name + ' after' + Name, arguments);
    },
    function() {
      return performActions(afterAction, actions, object, name, args);
    }
  );
};

var Action = {
  define: function(object, action) {
    Orbit.assert("Object must extend Evented", object.emit);
    if (Object.prototype.toString.call(action) === "[object Array]") {
      action.forEach(function(name) {
        defineAction(object, name);
      });
    } else {
      defineAction(object, action);
    }
  }
};

export default Action;