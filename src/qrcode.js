import jsQR from "jsqr";
import {muchAttrManyTimeWow} from './util'
var qr = require('qr-image');
export default class QRCodeController {

    app = null;
    ctx = null
    canvasElement = null
    onScanCallback = null

    
    drawLine(begin, end, color) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(begin.x, begin.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    /**
     * 
     * @param {string[]} output
     * @param {function} onScanCallback 
     */
    makeCode(output) {
        for (const i in output) {
            const imageEl = document.createElement("img");

            
            var qr_svg = qr.imageSync(output[i], { 
                type: 'svg',
                ec_level: "M",
                size: 35
            });

            muchAttrManyTimeWow(imageEl, [
                ["style", "width:320px; height: 320px;"],
                ["src", "data:image/svg+xml;utf8,"+qr_svg]
            ]);


            document.querySelector("#qr-output").appendChild(imageEl);
        }
        
    }

    activate = (onScanCallback) => {
        const video = this.video = document.createElement("video"),
            canvas = this.canvasElement = document.createElement("canvas"),
            tick = this.tick;

        muchAttrManyTimeWow(canvas, [
            ["width", 320],
            ["height", 240], // ????
            ["class", "qrcode-canvas"]
        ]);
        
        document.body.appendChild(canvas);

        this.ctx = this.canvasElement.getContext("2d");
        this.onScanCallback = onScanCallback;

        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        }).then(function(stream) {
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
            video.play();
            requestAnimationFrame(tick);
        });
    }

    tick = () => {
        const video = this.video,
            ctx = this.ctx,
            canvasElement = this.canvasElement;

        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.hidden = false;
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

            var imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);

            var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
            });

            if (code) {
                this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                // outputMessage.hidden = true;
                // outputData.parentElement.hidden = false;
                // outputData.innerText = code.data;
                console.log("%c "+code.data, "color:#00ff00; background: #000000;");
                console.log(this.onScanCallback)
                this.onScanCallback.apply(this.app, [code.data]);
            } else {
                // outputMessage.hidden = false;
                // outputData.parentElement.hidden = true;
            }
        }
        requestAnimationFrame(this.tick);
    }

}