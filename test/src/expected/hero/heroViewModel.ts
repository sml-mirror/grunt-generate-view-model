/*Codegen*/

  
export class HeroViewModel {
    
  public name: string;
  
  public age: string;
  
  constructor(model: any) {
      
    this.name = model.name;
    
    this.age = model.currentAge;
  }
}
