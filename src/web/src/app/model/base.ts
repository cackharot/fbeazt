export class ObjectId {
  $oid: string;

  static of(data) {
    if (data && data.constructor.name !== ObjectId.name) {
      if (data.$oid === undefined) {
        return new ObjectId();
      }

      return new ObjectId({ '$oid': data.$oid });
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
  }
}

export class Date {
  $date: number;

  static of(data) {
    if (data && data.constructor.name !== Date.name) {
      if (data.$date === undefined) {
        return new Date();
      }

      return new Date({ '$date': data.$date });
    }
    return data;
  }

  constructor(data = {}) {
    Object.assign(this, data);
  }
}
