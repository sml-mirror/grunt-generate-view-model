
import {createViewModelsInternal, createOptionsOfGrunt} from "./createViewModels";
export function makeView(grunt: IGrunt ) {
    grunt.registerMultiTask("generateViewModel", "Specify an generateViewModel configuration for future tasks in the chain", function() {
      var options = createOptionsOfGrunt(grunt);
      createViewModelsInternal();
  });
}
