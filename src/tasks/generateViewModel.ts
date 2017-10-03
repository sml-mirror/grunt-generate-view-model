"use strict";
import {createViewModels, createOptionsOfObject} from "./createViewModels";



function makeView(grunt: any) {
    grunt.registerMultiTask("generateViewModel", "Specify an generateViewModel configuration for future tasks in the chain", function() {
      var options = createOptionsOfObject(this);
      createViewModels(options);
  });
}
  module.exports = makeView;


