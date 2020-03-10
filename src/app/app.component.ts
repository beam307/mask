import { AfterViewInit, Component } from '@angular/core';
import { MaskService } from './service/mask.service';

declare var kakao;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  public map;
  public meter;
  public geocoder;
  public zoomControl;
  public markers = [];
  public options = {
    center: new kakao.maps.LatLng(37.428707, 127.151292),
    level: 5
  };

  constructor(private maskService: MaskService) {
  }

  ngAfterViewInit() {
    let container = document.getElementById('map');

    this.map = new kakao.maps.Map(container, this.options);
    this.map.setMaxLevel(10);
    this.geocoder = new kakao.maps.services.Geocoder();
    this.searchAddrFromCoords(this.map.getCenter(), this.displayCenterInfo.bind(this));

    this.zoomControl = new kakao.maps.ZoomControl();
    this.map.addControl(this.zoomControl, kakao.maps.ControlPosition.RIGHT);

    this.eventListener();

  }

  eventListener() {
    kakao.maps.event.addListener(this.map, 'idle', () => {

      this.searchAddrFromCoords(this.map.getCenter(), this.displayCenterInfo.bind(this));
    });
  }

  searchAddrFromCoords(coords, callback) {
    this.geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
  }

  displayCenterInfo(result, status) {
    if (status === kakao.maps.services.Status.OK) {
      let level = this.map.getLevel();
      this.meter = 1500 * Math.pow(2, level - 5);
      this.markers.forEach(m => {
        m.setMap(null);
      });
      this.markers = [];
      this.maskService.around(result[0].y, result[0].x, this.meter)
        .then(r => {
          r.stores.forEach(s => {
            let marker = new kakao.maps.Marker({
              map: this.map,
              position: new kakao.maps.LatLng(s.lat, s.lng)
            });
            let infowindow = new kakao.maps.InfoWindow({
              content: `<div>
                            <p>${ s.name }</p>
                            <p>${ s.remain_stat }</p>
                            <p>${ s.stock_at }</p>
                        </div>`
            });
            this.markers.push(marker);
            kakao.maps.event.addListener(marker, 'mouseover', this.makeOverListener(this.map, marker, infowindow));
            kakao.maps.event.addListener(marker, 'mouseout', this.makeOutListener(infowindow));
          });
        })
        .catch(e => {
          console.log(e);
        });
    }

    // empty 회색, few 빨강, ,some, 노랑 plenty 녹색
  }

  makeOverListener(map, marker, infowindow) {
    return () => {
      infowindow.open(map, marker);
    };
  }

  makeOutListener(infowindow) {
    return () => {
      infowindow.close();
    };
  }

  zoomIn() {
    this.map.setLevel(this.map.getLevel() - 1);
  }

  zoomOut() {
    this.map.setLevel(this.map.getLevel() + 1);
  }

}
