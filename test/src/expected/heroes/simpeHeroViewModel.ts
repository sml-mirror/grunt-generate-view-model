/*Codegen*/

export class SimpeHeroViewModel {

  public login: string;

  public age: string;

  public proffesion: string;

  public level: number;

  public siblings: string [];
  constructor(model?: SimpeHeroViewModel) {
  if (model) {
    if (model.login !== undefined) {
        this.login = model.login;
    }
    if (model.age !== undefined) {
        this.age = model.age;
    }
    if (model.proffesion !== undefined) {
        this.proffesion = model.proffesion;
    }
    if (model.level !== undefined) {
      if ( model.level === null) {
        this.level = null;
      } else {
        this.level = +model.level;
      }
    }
    if ( model.siblings !== undefined) {
      if (model.siblings === null) {
        this.siblings = null;
      } else {
        this.siblings = JSON.parse(JSON.stringify(model.siblings));
      }
    }
    }
  }
}
