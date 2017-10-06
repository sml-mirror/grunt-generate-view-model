"use strict";
import {createViewModelsInternal, createOptionsOfGrunt} from "./createViewModels";
function makeView(grunt: any ) {
    grunt.registerMultiTask("generateViewModel", "Specify an generateViewModel configuration for future tasks in the chain", function() {
      var options = createOptionsOfGrunt(this);
      createViewModelsInternal(options);
  });
}
  module.exports = makeView;


