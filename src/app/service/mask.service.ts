import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class MaskService {
  private ROUTES = {
    around: 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json'
  };

  constructor(private http: HttpClient) {
  }

  around(lat, lng, m): Promise<any> {
    return this.http.get(this.ROUTES.around, {
      params: {lat: lat, lng: lng, m: m}
    }).toPromise();
  }


}
