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
  public placeSearch;
  public markers = [];
  public hidden = false;
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

    this.placeSearch = new kakao.maps.services.Places();

    let zoomControl = new kakao.maps.ZoomControl();
    this.map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

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
    this.removeMaker();
    this.maskService.around(lng, lat, this.meter)
      .then(r => {
        r.stores
          .filter(s => !this.hidden || (s.remain_stat == 'plenty' || s.remain_stat == 'some' || s.remain_stat == 'few'))
          .forEach(s => this.addMarker(s));
      })
      .catch(e => {
        console.log(e);
      });
  }

  removeMaker() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
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
    marker.setMap(this.map);
    this.markers.push(marker);

    this.markerEventListen(content, info);
  }

  markerEventListen(content, info) {
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
    } else if (status == null) {
      return '정보없음';
    } else {
      return '품절';
    }
  }

  search(event) {
    this.placeSearch.keywordSearch(event, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        this.map.setCenter(new kakao.maps.LatLng(data[0].y, data[0].x));
        this.map.setLevel(3);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        this.showToarst('검색 결과가 존재하지 않습니다.');
        return;
      } else if (status === kakao.maps.services.Status.ERROR) {
        this.showToarst('검색 결과 중 오류가 발생했습니다.');
        return;

      }
    });
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.map.panTo(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
      }, () => {
        this.showToarst('위치찾기를 실패하였습니다.');
      }, {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: Infinity
      });
    } else {
      this.showToarst('위치찾기를 실패하였습니다.');
    }
  }

  showToarst(text) {
    let x = document.getElementById('toarst');
    x.className = 'show';
    x.innerText = text;
    setTimeout(() => {
      x.className = x.className.replace('show', '');
    }, 2000);
  }

}
