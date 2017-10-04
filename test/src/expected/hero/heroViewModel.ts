/*Codegen*/

  
export class HeroViewModel {
  public login: string;
  public age: string;
  public proffesion: string;
  public level: number;
  public siblings: string [];
  constructor(model: any) {
    
    this.login = model.name;
      
    this.age = model.age;
        
    this.proffesion = model.proffesion;
      
    this.level = model.level;
      
    if ( model.siblings ) {
      this.siblings = model.siblings.map(function(item: any) {
          return JSON.parse(JSON.stringify(item));
        });
    }

  }
}
