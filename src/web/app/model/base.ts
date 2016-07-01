export class ObjectId {
  $oid: string;

  constructor(data={}){
    Object.assign(this, data);
  }

  static of(data){
    if(data && data.constructor.name != ObjectId.name){
      if(data.$oid == undefined){
        return new ObjectId();
      }
      return new ObjectId({"$oid": data.$oid});
    }
    return data;
  }
}

export class Date {
  $date: number;

  constructor(data={}){
    Object.assign(this, data);
  }
}
