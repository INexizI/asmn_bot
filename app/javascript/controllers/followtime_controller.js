// import { Controller } from "@hotwired/stimulus"
//
// export default class extends Controller {
//   static values = {
//     date: { type: Number, default: Date.now() },
//     refreshInterval: { type: Number, default: 1000 },
//     message: { type: String, default: 'Follow time: ${years} ${months} ${days}!'}
//   }
//
//   connect() {
//     if (this.hasDateValue) {
//       this.endTime = new Date(this.dateValue).getTime()
//
//       this.update()
//       this.timer = setInterval(() => {
//         this.update()
//       }, this.refreshIntervalValue)
//     } else {
//       console.error("Missing data-countdown-date-value attribute", this.element)
//     }
//   }
//
//   disconnect() {
//     this.stopTimer()
//   }
//
//   stopTimer() {
//     if (this.timer) {
//       clearInterval(this.timer)
//     }
//   }
//
//   update() {
//     let difference = this.timeDifference()
//
//     // if (difference < 0) {
//     //   this.element.textContent = this.expiredMessageValue
//     //   this.stopTimer()
//     //   return
//     // }
//
//     let second, minute, hour, day, month, year;
//
//     second = Math.floor(difference / 1000);
//     minute = Math.floor(second / 60);
//     second = second % 60;
//     hour = Math.floor(minute / 60);
//     minute = minute % 60;
//     day = Math.floor(hour / 24);
//     hour = hour % 24;
//     month = Math.floor(day / 30);
//     day = day % 30;
//     year = Math.floor(month / 12);
//     month = month % 12;
//
//     this.element.textContent = this.messageValue
//       .replace("${second}", second)
//       .replace("${minute}", minute)
//       .replace("${hour}", hour)
//       .replace("${day}", day)
//       .replace("${month}", month)
//       .replace("${year}", year)
//   }
//
//   timeDifference() {
//     return new Date().getTime() - this.endTime
//   }
// }
