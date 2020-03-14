import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { MaskService } from './service/mask.service';

declare var kakao;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {

  public map;
  public meter;
  public customOverlay;
  public geocoder;
  public zoomControl;
  public markers = [];
  public options = {
    center: new kakao.maps.LatLng(37.428707, 127.151292),
    level: 3
  };

  constructor(private maskService: MaskService) {
  }

  ngAfterViewInit() {
    let container = document.getElementById('map');

    this.map = new kakao.maps.Map(container, this.options);
    this.map.setMaxLevel(9);
    this.getLocation();
    this.customOverlay = new kakao.maps.CustomOverlay({zIndex: 2});
    this.geocoder = new kakao.maps.services.Geocoder();

    this.zoomControl = new kakao.maps.ZoomControl();
    this.map.addControl(this.zoomControl, kakao.maps.ControlPosition.RIGHT);

    this.displayCenterInfo(this.map.getCenter());
    this.eventListener();

  }

  eventListener() {
    kakao.maps.event.addListener(this.map, 'idle', () => {
      this.displayCenterInfo(this.map.getCenter());
    });

    document.addEventListener('click', (e: any) => {
      e.stopImmediatePropagation();
      if (!e.target.classList.contains('marker')) {
        this.customOverlay.setMap(null);
      }
    });

  }

  displayCenterInfo(result) {
    let level = this.map.getLevel();
    this.meter = level > 5 ? 972 : 12 * Math.pow(level + 4, 2);
    this.callAPI(result.getLat(), result.getLng());
  }

  callAPI(lng, lat) {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    this.maskService.around(lng, lat, this.meter)
      .then(r => r.stores.forEach(s => this.addMarker(s)))
      .catch(e => {
        console.log(e);
      });
  }

  addMarker(info) {
    let content = document.createElement('div');
    content.className = 'info';
    content.innerHTML = `
      <div class="marker" style="background: ${ this.color(info.remain_stat) }">
        ${ this.title(info.remain_stat) }
      </div>
    `;
    let marker = new kakao.maps.CustomOverlay({
      map: this.map,
      content: content,
      position: new kakao.maps.LatLng(info.lat, info.lng)
    });
    this.markers.push(marker);
    marker.setMap(this.map);

    content.addEventListener('click', () => {
      let content = `
        <div class="name">
            <p class="title">이름 : ${ info.name || '정보없음' }</p>
            <p>주소 : ${ info.addr || '정보없음' }</p>
            <p>입고날짜 : ${ info.stock_at || '정보없음' }</p>
            <p>업데이트날짜 : ${ info.created_at || '정보없음' }</p>
        </div>
      `;
      this.customOverlay.setContent(content);
      this.customOverlay.setPosition(new kakao.maps.LatLng(info.lat, info.lng));
      this.customOverlay.setMap(this.map);
    });

    content.addEventListener('mouseover', () => {
      let content = `
        <div class="name">
            <p class="title">이름 : ${ info.name || '정보없음' }</p>
            <p>주소 : ${ info.addr || '정보없음' }</p>
            <p>입고날짜 : ${ info.stock_at || '정보없음' }</p>
            <p>업데이트날짜 : ${ info.created_at || '정보없음' }</p>
        </div>
      `;
      this.customOverlay.setContent(content);
      this.customOverlay.setPosition(new kakao.maps.LatLng(info.lat, info.lng));
      this.customOverlay.setMap(this.map);
    });

    content.addEventListener('mouseout', () => {
      this.customOverlay.setMap(null);
    });
  }

  color(status?) {
    if (status == 'plenty') {
      return '#178e1d';
    } else if (status == 'some') {
      return '#ffa223';
    } else if (status == 'few') {
      return '#d3171e';
    } else if (status == 'break') {
      return '#000';
    } else {
      return '#5d5d5d';
    }
  }

  title(status?) {
    if (status == 'plenty') {
      return '100개 이상';
    } else if (status == 'some') {
      return '30~99개';
    } else if (status == 'few') {
      return '2~29개';
    } else if (status == 'break') {
      return '판매중지';
    } else {
      return '품절';
    }
  }

  search(event) {
    this.geocoder.addressSearch(event, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        this.map.setCenter(new kakao.maps.LatLng(result[0].y, result[0].x));
        this.map.setLevel(3);
      }
    });
  }


  zoomIn() {
    this.map.setLevel(this.map.getLevel() - 1);
  }

  zoomOut() {
    this.map.setLevel(this.map.getLevel() + 1);
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.map.panTo(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
      }, (error) => {
        console.error(error);
      }, {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: Infinity
      });
    } else {
      console.log('GPS를 지원하지 않습니다');
    }
  }

}
