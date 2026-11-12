"use strict";
const $ = s => document.querySelector(s);
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- ngôn ngữ / language ---------- */
const I18N = {"vi": {"brandSub": "ROS AI Kit · mô phỏng", "nbAria": "Tên notebook", "kLoad": "Đang tải Python…", "kFail": "Không tải được Python", "kIdle": "Python 3 · Sẵn sàng", "kBusy": "Đang chạy…", "map": "Sa bàn", "speed": "Tốc độ", "langAria": "Ngôn ngữ", "rail": "Thanh bên", "rNb": "Bài mẫu", "rApi": "Tra cứu API", "rOpen": "Mở tệp .ipynb / .py", "aiNoScene": "Sa bàn 3D chưa sẵn sàng.", "hideField": "Ẩn sa bàn", "hideFieldT": "Ẩn sa bàn để xem bài học toàn màn hình", "showField": "Hiện sa bàn", "showFieldT": "Hiện lại sa bàn 3D", "aiPose": "Di chuyển robot:", "aiBump": "Robot vướng vật cản, không dịch được.", "tEdit": "Sửa vật cản", "tEditT": "Đặt / xoá khối vuông: bấm vào nền để đặt, bấm vào khối để xoá", "editToast": "Bấm vào nền để đặt khối, bấm vào khối để xoá", "boxReset": "Khôi phục", "boxResetT": "Khôi phục vật cản gốc của sa bàn này", "boxResetDone": "Đã khôi phục vật cản gốc", "boxOnRobot": "Không đặt khối đè lên robot", "aiOldFrame": "Ảnh này đã cũ, hãy chụp lại bằng camera.value.", "aiEmpty": "Bộ dữ liệu đang trống.", "aiNetSees": "Mạng nơ-ron thấy (16×16)", "aiUndo": "Xoá ảnh vừa thêm", "aiNotTrained": "Mô hình chưa được huấn luyện. Hãy gọi model.train(dataset) hoặc model.load('collision_model.pth').", "aiNeedData": "Cần ít nhất 4 ảnh mỗi loại để huấn luyện", "aiTrainHead": "Ảnh huấn luyện: {tr} · ảnh kiểm tra: {te}", "aiSaved": "Đã lưu mô hình: ", "aiSaveFail": "Không lưu được mô hình (bộ nhớ trình duyệt đầy?).", "aiNoModel": "Chưa có mô hình '{p}'. Hãy chạy bài 12 để huấn luyện và lưu mô hình.", "aiOut": "Robot đã ra ngoài vạch đen!", "rSave": "Lưu notebook về máy (.ipynb) · Ctrl+S", "rNew": "Tạo notebook mới", "saved": "Đã lưu ", "newConfirm": "Tạo notebook mới? Nội dung hiện tại sẽ bị thay thế. Hãy bấm Lưu trước nếu muốn giữ lại.", "newDone": "Đã tạo notebook mới", "run": "Chạy", "runT": "Chạy tất cả các ô (Shift+Enter: chạy ô đang chọn)", "stop": "Dừng", "stopT": "Dừng chương trình và động cơ (Esc Esc)", "restart": "Khởi động lại", "restartT": "Khởi động lại kernel: xoá mọi biến, đồng hồ về 0", "addCode": "Code", "addCodeT": "Thêm ô code bên dưới", "addMd": "Ghi chú", "addMdT": "Thêm ô ghi chú bên dưới", "clear": "Xoá kết quả", "clearT": "Xoá kết quả của mọi ô", "copy": "Sao chép code", "copyT": "Sao chép toàn bộ code", "splitAria": "Kéo để đổi kích thước", "vIso": "3D", "vTop": "Trên", "vFront": "Trước", "vSide": "Cạnh", "vFollow": "Theo robot", "tLidar": "Lidar", "tTrail": "Vết", "tCam": "Camera", "tAxis": "Trục Oxyz", "tAxisT": "Hệ trục gắn với robot: x mũi robot, y bên trái, z hướng lên", "tLbl": "Linh kiện", "tKey": "Lái phím", "tKeyT": "Lái bằng phím mũi tên / WASD", "home": "Về xuất phát", "homeT": "Đặt robot về vị trí xuất phát, xoá encoder, IMU và đồng hồ", "sceneLoading": "Đang dựng sa bàn 3D…", "sceneFail": "Không tải được thư viện 3D. Kiểm tra kết nối mạng.", "pip": "CAMERA CSI · GÓC RỘNG", "teleop": "Lái phím: ↑ ↓ ← → hoặc W A S D", "hint": "<kbd>Chuột phải</kbd> xoay 3D · <kbd>Shift</kbd>+<kbd>Chuột phải</kbd> hoặc <kbd>Chuột trái</kbd> vào nền: dời khung nhìn · <kbd>Cuộn</kbd> phóng to<br><kbd>Chuột trái</kbd> kéo robot, <kbd>Cuộn</kbd> khi đang kéo để xoay robot · thả gần ô START để về vị trí xuất phát", "telePos": "Vị trí x, y (cm)", "teleYaw": "Hướng (yaw)", "teleMot": "Động cơ T / P", "teleEnc": "Encoder T / P", "teleLid": "Lidar 0°", "teleLine": "Camera line", "teleTime": "Thời gian chạy", "noLine": "không thấy", "stopped": " · dừng", "pyLoading": "Python đang tải, chờ một chút…", "restarted": "Đã khởi động lại kernel: biến đã xoá, đồng hồ về 0", "copied": "Đã sao chép code", "opened": "Đã mở ", "openFail": "Không đọc được tệp: cần .ipynb hợp lệ hoặc .py", "teleopToast": "Bấm vào sa bàn rồi dùng phím mũi tên để lái", "homeToast": "Robot đã về vị trí xuất phát · encoder, IMU và đồng hồ về 0", "drawerLessons": "Bài mẫu", "drawerApi": "Thư viện jetbot", "insert": "Chèn", "cellCode": "Ô code", "cellMd": "Ô ghi chú", "cRun": "Chạy ô (Shift+Enter)", "cStop": "Dừng", "cUp": "Chuyển lên", "cDown": "Chuyển xuống", "cType": "Đổi Code / Ghi chú", "cDel": "Xoá ô", "grip": "Kéo để đổi thứ tự ô", "addRowCode": "+ Ô code", "addRowMd": "+ Ô ghi chú", "mdEmpty": "Nhấp đúp để viết ghi chú…", "trimmed": "…(đã lược bớt)", "interrupted": "chương trình đã được dừng. Động cơ đã tắt.", "line": "dòng", "inputAria": "Nhập dữ liệu", "goal": "ĐÍCH", "editNote": "Sửa ghi chú (hoặc nhấp đúp vào ghi chú)", "doneNote": "Xong, hiển thị ghi chú", "step": "Chạy từng ô", "stepT": "Mỗi lần bấm chạy ô code kế tiếp (bỏ qua ghi chú)", "stepDone": "Đã chạy hết các ô, lần bấm tới sẽ chạy lại từ ô đầu", "stepBusy": "Ô trước đang chạy, chờ xong hoặc bấm Dừng", "noFiles": "Mô phỏng không cho phép đọc / ghi tệp.", "blockedMod": "Thư viện này bị chặn trong mô phỏng vì lý do an toàn.", "fileTooBig": "Tệp quá lớn (tối đa 20 MB).", "noVoice": "Trình duyệt chưa có giọng đọc tiếng Anh. Cài thêm giọng English trong cài đặt giọng nói của máy (Windows: Settings → Time & Language → Speech).", "autosaveNoImg": "Ảnh trong notebook quá lớn để tự lưu vào trình duyệt. Hãy bấm Lưu tệp (Ctrl+S) để giữ ảnh.", "badNotebook": "Notebook không hợp lệ hoặc quá nhiều ô (tối đa 300)."}, "en": {"brandSub": "ROS AI Kit · simulator", "nbAria": "Notebook name", "kLoad": "Loading Python…", "kFail": "Python failed to load", "kIdle": "Python 3 · Ready", "kBusy": "Running…", "map": "Field", "speed": "Speed", "langAria": "Language", "rail": "Sidebar", "rNb": "Sample lessons", "rApi": "API reference", "rOpen": "Open .ipynb / .py file", "aiNoScene": "The 3D field is not ready.", "hideField": "Hide field", "hideFieldT": "Hide the field to see the lesson full width", "showField": "Show field", "showFieldT": "Show the 3D field again", "aiPose": "Move robot:", "aiBump": "Blocked by an obstacle, cannot move there.", "tEdit": "Edit obstacles", "tEditT": "Add / remove blocks: click the floor to add, click a block to remove", "editToast": "Click the floor to add a block, click a block to remove it", "boxReset": "Reset", "boxResetT": "Restore this field's original obstacles", "boxResetDone": "Original obstacles restored", "boxOnRobot": "Cannot place a block on the robot", "aiOldFrame": "This image is too old, take a new one with camera.value.", "aiEmpty": "The dataset is empty.", "aiNetSees": "What the network sees (16×16)", "aiUndo": "Remove last image", "aiNotTrained": "The model is not trained. Call model.train(dataset) or model.load('collision_model.pth').", "aiNeedData": "Need at least 4 images of each class to train", "aiTrainHead": "Training images: {tr} · test images: {te}", "aiSaved": "Model saved: ", "aiSaveFail": "Could not save the model (browser storage full?).", "aiNoModel": "No model '{p}' yet. Run lesson 12 to train and save one.", "aiOut": "The robot left the black line!", "rSave": "Save notebook to your computer (.ipynb) · Ctrl+S", "rNew": "New notebook", "saved": "Saved ", "newConfirm": "Create a new notebook? The current one will be replaced. Save it first if you want to keep it.", "newDone": "New notebook created", "run": "Run", "runT": "Run every cell (Shift+Enter: run selected cell)", "stop": "Stop", "stopT": "Stop the program and motors (Esc Esc)", "restart": "Restart", "restartT": "Restart kernel: clear all variables, reset the clock", "addCode": "Code", "addCodeT": "Add a code cell below", "addMd": "Note", "addMdT": "Add a note cell below", "clear": "Clear outputs", "clearT": "Clear the output of every cell", "copy": "Copy code", "copyT": "Copy all code", "splitAria": "Drag to resize", "vIso": "3D", "vTop": "Top", "vFront": "Front", "vSide": "Side", "vFollow": "Follow", "tLidar": "Lidar", "tTrail": "Trail", "tCam": "Camera", "tAxis": "Axes", "tAxisT": "Robot frame: x forward, y left, z up", "tLbl": "Parts", "tKey": "Drive", "tKeyT": "Drive with arrow keys / WASD", "home": "Back to start", "homeT": "Put the robot back at START and reset encoders, IMU and clock", "sceneLoading": "Building the 3D field…", "sceneFail": "The 3D library failed to load. Check your internet connection.", "pip": "CSI CAMERA · WIDE ANGLE", "teleop": "Drive: ↑ ↓ ← → or W A S D", "hint": "<kbd>Right-drag</kbd> rotate 3D · <kbd>Shift</kbd>+<kbd>Right-drag</kbd> or <kbd>Left-drag</kbd> on the floor: pan · <kbd>Scroll</kbd> zoom<br><kbd>Left-drag</kbd> the robot to move it, <kbd>Scroll</kbd> while dragging to rotate it · drop it near START to reset", "telePos": "Position x, y (cm)", "teleYaw": "Heading (yaw)", "teleMot": "Motors L / R", "teleEnc": "Encoder L / R", "teleLid": "Lidar 0°", "teleLine": "Camera line", "teleTime": "Run time", "noLine": "not seen", "stopped": " · idle", "pyLoading": "Python is still loading, one moment…", "restarted": "Kernel restarted: variables cleared, clock reset", "copied": "Code copied", "opened": "Opened ", "openFail": "Could not read the file: use a valid .ipynb or .py", "teleopToast": "Click the field, then drive with the arrow keys", "homeToast": "Robot is back at START · encoders, IMU and clock reset", "drawerLessons": "Sample lessons", "drawerApi": "jetbot library", "insert": "Insert", "cellCode": "Code cell", "cellMd": "Note cell", "cRun": "Run cell (Shift+Enter)", "cStop": "Stop", "cUp": "Move up", "cDown": "Move down", "cType": "Switch Code / Note", "cDel": "Delete cell", "grip": "Drag to reorder", "addRowCode": "+ Code cell", "addRowMd": "+ Note cell", "mdEmpty": "Double-click to write a note…", "trimmed": "…(truncated)", "interrupted": "the program was stopped. Motors are off.", "line": "line", "inputAria": "Input", "goal": "GOAL", "editNote": "Edit note (or double-click the note)", "doneNote": "Done, show the note", "step": "Step", "stepT": "Each click runs the next code cell (notes are skipped)", "stepDone": "All cells done, the next click starts again from the first cell", "stepBusy": "The previous cell is still running, wait or press Stop", "noFiles": "Reading or writing files is not allowed in the simulator.", "blockedMod": "This library is blocked in the simulator for safety.", "fileTooBig": "File too large (20 MB max).", "noVoice": "This browser has no English voice. Add an English voice in your system speech settings (Windows: Settings → Time & Language → Speech).", "autosaveNoImg": "The images in this notebook are too big to auto-save in the browser. Use Save (Ctrl+S) to keep them.", "badNotebook": "Invalid notebook or too many cells (300 max)."}};
let LANG = (() => { const v = store.get("jetbotlab.lang"); return v === "en" || v === "vi" ? v : "vi"; })();
const t = k => (I18N[LANG] && I18N[LANG][k] !== undefined ? I18N[LANG][k] : (I18N.vi[k] !== undefined ? I18N.vi[k] : k));

/* =====================================================================
   1. SA BÀN (đơn vị mét, hệ toạ độ ROS: x tiến, y trái, z lên)
   ===================================================================== */
const FIELD = { w: 2.4, h: 1.6 };
function stadium(L, r){
  const p = [], n = 36;
  for (let i = 0; i <= 10; i++) p.push([-L/2 + L*i/10, -r]);
  for (let i = 1; i < n; i++){ const a = -Math.PI/2 + Math.PI*i/n; p.push([L/2 + r*Math.cos(a), r*Math.sin(a)]); }
  for (let i = 0; i <= 10; i++) p.push([L/2 - L*i/10, r]);
  for (let i = 1; i < n; i++){ const a = Math.PI/2 + Math.PI*i/n; p.push([-L/2 + r*Math.cos(a), r*Math.sin(a)]); }
  return p;
}
function roundRect(hw, hh, r, n = 8){
  const p = [];
  [[hw-r, hh-r], [-hw+r, hh-r], [-hw+r, -hh+r], [hw-r, -hh+r]].forEach(([cx, cy], q) => {
    for (let i = 0; i <= n; i++){ const a = (q + i/n)*Math.PI/2; p.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]); }
  });
  return p;
}
const ZONE = { red:"#d8403a", green:"#3fa34d", blue:"#2f6fd0", yellow:"#e8b923" };
const MAPS = {
  open: { name:"Sân trống · lưới 10 cm", start:{x:0, y:0, th:0}, boxes:[], line:null,
    zones:[{x:-0.95,y:0.55,w:0.3,h:0.3,c:"red"},{x:0.95,y:0.55,w:0.3,h:0.3,c:"green"},{x:-0.95,y:-0.55,w:0.3,h:0.3,c:"blue"},{x:0.95,y:-0.55,w:0.3,h:0.3,c:"yellow"}] },
  line: { name:"Dò line · đường đua", start:{x:-0.2, y:-0.5, th:0}, boxes:[], line:stadium(1.1, 0.5),
    zones:[{x:0.55,y:-0.5,w:0.06,h:0.16,c:"red"}] },
  obst: { name:"Vật cản · Lidar", start:{x:-0.95, y:-0.6, th:0},
    boxes:[{x:-0.42,y:-0.45,w:0.16,d:0.16},{x:0.1,y:-0.12,w:0.32,d:0.12},{x:-0.55,y:0.22,w:0.12,d:0.32},{x:0.5,y:0.32,w:0.16,d:0.16},{x:0.62,y:-0.48,w:0.2,d:0.2},{x:-0.05,y:0.5,w:0.22,d:0.1}],
    line:null, zones:[{x:0.98,y:0.58,w:0.36,h:0.36,c:"green"}] },
  maze: { name:"Mê cung · bám tường", start:{x:-0.92, y:-0.55, th:Math.PI/2},
    boxes:[{x:-0.6,y:-0.25,w:0.03,d:1.1},{x:0,y:0.25,w:0.03,d:1.1},{x:0.6,y:-0.25,w:0.03,d:1.1}],
    line:null, zones:[{x:0.92,y:-0.58,w:0.4,h:0.34,c:"green"}] },
  arena: { name:"Tránh vật cản AI · camera", start:{x:-0.7, y:-0.38, th:0}, fence:true,
    boxes:[{x:-0.2,y:-0.36,w:0.14,d:0.14},{x:0.45,y:0.08,w:0.12,d:0.3},{x:-0.52,y:0.3,w:0.22,d:0.1},{x:0.08,y:0.42,w:0.12,d:0.12},{x:0.74,y:-0.4,w:0.16,d:0.16}],
    line:roundRect(1.02, 0.64, 0.22), zones:[] }
};
// Vật cản người dùng đặt / xoá được lưu theo từng sa bàn; BOX_DEFAULT giữ bố trí gốc để khôi phục.
const BOX_DEFAULT = {}; for (const k in MAPS) BOX_DEFAULT[k] = JSON.stringify(MAPS[k].boxes);
(() => {
  const s = store.get("jetbotlab.boxes.v1"); if (!s || typeof s !== "object") return;
  const ok = b => b && [b.x, b.y, b.w, b.d].every(v => typeof v === "number" && isFinite(v)) && b.w > 0 && b.w < 1.5 && b.d > 0 && b.d < 1.5;
  for (const k in s) if (Object.prototype.hasOwnProperty.call(MAPS, k) && Array.isArray(s[k])) MAPS[k].boxes = s[k].filter(ok).slice(0, 60).map(b => ({ x: b.x, y: b.y, w: b.w, d: b.d }));
})();
function saveBoxes(){ const o = {}; for (const k in MAPS) if (JSON.stringify(MAPS[k].boxes) !== BOX_DEFAULT[k]) o[k] = MAPS[k].boxes; store.set("jetbotlab.boxes.v1", o); }
let MAP = MAPS.open, MAPID = "open";
function allBoxes(){
  const t = 0.04, W = FIELD.w/2, H = FIELD.h/2;
  return MAP.boxes.concat([
    {x:0, y:H+t/2, w:FIELD.w+2*t, d:t, wall:1},{x:0, y:-H-t/2, w:FIELD.w+2*t, d:t, wall:1},
    {x:W+t/2, y:0, w:t, d:FIELD.h, wall:1},{x:-W-t/2, y:0, w:t, d:FIELD.h, wall:1}]);
}
let BOXES = allBoxes();

/* =====================================================================
   2. MÔ PHỎNG VẬT LÝ JETBOT
   ===================================================================== */
const RB = { D:0.065, TRACK:0.17, VMAX:0.6, TAU:0.08, TPR:1320, BODY_OFF:0, RADIUS:0.105, LIDAR_OFF:0.004, LIDAR_H:0.16, CAM_LOOK:0.16 };
const SIM = {
  t:0, t0:0, runT:0, x:0, y:0, th:0, vl:0, vr:0, cmd:[0,0], encL:0, encR:0, yaw:0, gyro:0, ax:0, ay:0, bumpT:0,
  angL:0, angR:0, lidarAng:0, sleepers:[], dragging:false, oled:["JetBot","IP 192.168.1.8","",""], oledDirty:true,
  clamp(v){ v = Number(v); if (!isFinite(v)) v = 0; return Math.max(-1, Math.min(1, v)); },
  setMotors(l, r){ this.cmd[0] = this.clamp(l); this.cmd[1] = this.clamp(r); },
  setMotor(i, v){ this.cmd[i ? 1 : 0] = this.clamp(v); },
  sleep(s){ s = Math.max(0, Number(s) || 0); return new Promise(res => this.sleepers.push({ until: this.t + s, res })); },
  wakeAll(){ const s = this.sleepers; this.sleepers = []; s.forEach(o => o.res()); },
  nextWake(){ let m = Infinity; for (const o of this.sleepers) if (o.until < m) m = o.until; return m; },
  collides(x, y){
    const cx = x + RB.BODY_OFF*Math.cos(this.th), cy = y + RB.BODY_OFF*Math.sin(this.th), r2 = RB.RADIUS*RB.RADIUS;
    for (const b of BOXES){
      const px = Math.max(b.x-b.w/2, Math.min(cx, b.x+b.w/2)), py = Math.max(b.y-b.d/2, Math.min(cy, b.y+b.d/2));
      if ((px-cx)*(px-cx)+(py-cy)*(py-cy) < r2) return true;
    }
    return false;
  },
  step(dt){
    const k = 1 - Math.exp(-dt/RB.TAU);
    if (this.dragging){ this.vl = this.vr = 0; }
    else { this.vl += (this.cmd[0]*RB.VMAX - this.vl)*k; this.vr += (this.cmd[1]*RB.VMAX - this.vr)*k; }
    const vOld = (this.vl + this.vr)/2;
    const v = vOld, w = (this.vr - this.vl)/RB.TRACK, mth = this.th + w*dt/2;
    const nx = this.x + v*Math.cos(mth)*dt, ny = this.y + v*Math.sin(mth)*dt;
    if (!this.dragging){
      if (this.collides(nx, ny)){
        this.bumpT = 0.3;
        if (!this.collides(nx, this.y)) this.x = nx; else if (!this.collides(this.x, ny)) this.y = ny;
      } else { this.x = nx; this.y = ny; }
      this.th += w*dt;
      if (this.th > Math.PI) this.th -= 2*Math.PI; if (this.th < -Math.PI) this.th += 2*Math.PI;
    }
    const circ = Math.PI*RB.D;
    this.encL += this.vl*dt/circ*RB.TPR; this.encR += this.vr*dt/circ*RB.TPR;
    this.angL += this.vl*dt/(RB.D/2); this.angR += this.vr*dt/(RB.D/2);
    this.ax += ((v - (this._vp||0))/dt - this.ax)*0.2; this._vp = v; this.ay = v*w;
    this.yaw += w*dt*180/Math.PI; this.gyro = w*180/Math.PI;
    this.bumpT = Math.max(0, this.bumpT - dt);
    this.lidarAng += dt*2*Math.PI*7;
    this.t += dt;
    if (K.running) this.runT += dt;
    if (this.sleepers.length){
      const due = this.sleepers.filter(o => o.until <= this.t + 1e-9);
      if (due.length){ this.sleepers = this.sleepers.filter(o => o.until > this.t + 1e-9); this.woke = true; due.forEach(o => o.res()); }
    }
  },
  ray(ox, oy, dx, dy){
    let best = 12;
    for (const b of BOXES){
      let t0 = 0, t1 = Infinity, ok = true;
      for (let a = 0; a < 2; a++){
        const o = a ? oy : ox, d = a ? dy : dx, mn = a ? b.y-b.d/2 : b.x-b.w/2, mx = a ? b.y+b.d/2 : b.x+b.w/2;
        if (Math.abs(d) < 1e-9){ if (o < mn || o > mx){ ok = false; break; } }
        else { let ta = (mn-o)/d, tb = (mx-o)/d; if (ta > tb){ const s = ta; ta = tb; tb = s; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1){ ok = false; break; } }
      }
      if (ok && t0 < best) best = t0;
    }
    return best;
  },
  lidarOrigin(){ return [this.x + RB.LIDAR_OFF*Math.cos(this.th), this.y + RB.LIDAR_OFF*Math.sin(this.th)]; },
  lidarAt(deg){ const [ox, oy] = this.lidarOrigin(), a = this.th + deg*Math.PI/180; return Math.round(this.ray(ox, oy, Math.cos(a), Math.sin(a))*1000)/1000; },
  lidarScan(){ const out = new Array(360); for (let i = 0; i < 360; i++) out[i] = this.lidarAt(i); return out; },
  lidarMin(s, e){ s = Math.round(s); e = Math.round(e); if (e < s){ const t = s; s = e; e = t; } let m = 12; for (let a = s; a <= e; a++){ const d = this.lidarAt(((a%360)+360)%360); if (d < m) m = d; } return m; },
  onLine(px, py){
    const p = MAP.line; if (!p) return false;
    const hw = 0.0135; let best = 1e9;
    for (let i = 0; i < p.length; i++){
      const a = p[i], b = p[(i+1)%p.length], vx = b[0]-a[0], vy = b[1]-a[1], L2 = vx*vx+vy*vy;
      let t = L2 ? ((px-a[0])*vx + (py-a[1])*vy)/L2 : 0; t = Math.max(0, Math.min(1, t));
      const dx = a[0]+t*vx-px, dy = a[1]+t*vy-py, d = dx*dx+dy*dy; if (d < best) best = d;
    }
    return best < hw*hw;
  },
  linePos(){
    const c = Math.cos(this.th), s = Math.sin(this.th), fx = this.x + c*RB.CAM_LOOK, fy = this.y + s*RB.CAM_LOOK;
    let sum = 0, n = 0;
    for (let i = -20; i <= 20; i++){ const o = i*0.006; if (this.onLine(fx + s*o, fy - c*o)){ sum += o; n++; } }
    return n ? Math.round(sum/n/0.12*1000)/1000 : null;
  },
  color(){
    const px = this.x + Math.cos(this.th)*0.1, py = this.y + Math.sin(this.th)*0.1;
    for (const z of MAP.zones) if (Math.abs(px-z.x) <= z.w/2 && Math.abs(py-z.y) <= z.h/2) return z.c;
    return null;
  },
  resetClock(){ this.t0 = this.t; this.runT = 0; },
  place(pose, resetSensors){
    this.x = pose.x; this.y = pose.y; this.th = pose.th; this.vl = this.vr = 0; this._vp = 0; this.ax = this.ay = 0;
    if (resetSensors){ this.encL = this.encR = 0; this.yaw = 0; this.gyro = 0; }
  },
  oledText(s, line){ line = Math.max(0, Math.min(3, line|0)); this.oled[line] = String(s).slice(0, 21); this.oledDirty = true; },
  oledClear(){ this.oled = ["","","",""]; this.oledDirty = true; }
};
window.SIM = SIM;

/* =====================================================================
   3. THƯ VIỆN PYTHON "jetbot" CHO KERNEL
   ===================================================================== */
const JETBOT_PY = `import _sim
import math

class _Motor(object):
    def __init__(self, side):
        self._side = side
    def _get_value(self):
        return _sim.get_motor(self._side)
    def _set_value(self, v):
        _sim.set_motor(self._side, float(v))
    value = property(_get_value, _set_value)

class Robot(object):
    """JetBot: hai động cơ DC có encoder, tốc độ -1.0 .. 1.0"""
    def __init__(self, *args, **kwargs):
        self.left_motor = _Motor(0)
        self.right_motor = _Motor(1)
    def set_motors(self, left_speed, right_speed):
        _sim.set_motors(float(left_speed), float(right_speed))
    def forward(self, speed=1.0, duration=None):
        self.set_motors(speed, speed)
        self._hold(duration)
    def backward(self, speed=1.0, duration=None):
        self.set_motors(-speed, -speed)
        self._hold(duration)
    def left(self, speed=1.0, duration=None):
        self.set_motors(-speed, speed)
        self._hold(duration)
    def right(self, speed=1.0, duration=None):
        self.set_motors(speed, -speed)
        self._hold(duration)
    def stop(self):
        self.set_motors(0, 0)
    def bumped(self):
        return _sim.bumped()
    def _hold(self, duration):
        if duration is not None:
            _sim.sleep(float(duration))
            self.stop()

class Encoder(object):
    TICKS_PER_REV = 1320
    WHEEL_DIAMETER = 0.065
    def __init__(self, *args, **kwargs):
        pass
    def left(self):
        return _sim.encoder(0)
    def right(self):
        return _sim.encoder(1)
    def read(self):
        return (_sim.encoder(0), _sim.encoder(1))
    def reset(self):
        _sim.encoder_reset()
    def distance(self):
        k = math.pi * self.WHEEL_DIAMETER / self.TICKS_PER_REV
        return (_sim.encoder(0) * k, _sim.encoder(1) * k)
    def speed(self):
        v = _sim.wheel_speed()
        return (v[0], v[1])

class IMU(object):
    def __init__(self, *args, **kwargs):
        pass
    def yaw(self):
        return _sim.imu_yaw()
    def heading(self):
        return _sim.imu_yaw() % 360
    def gyro(self):
        return _sim.imu_gyro()
    def accel(self):
        a = _sim.imu_accel()
        return (a[0], a[1], a[2])
    def reset(self):
        _sim.imu_reset()

class Lidar(object):
    def __init__(self, *args, **kwargs):
        pass
    def scan(self):
        return _sim.lidar_scan()
    def distance(self, angle):
        return _sim.lidar_at(int(round(angle)) % 360)
    def min_distance(self, start=-180, end=180):
        return _sim.lidar_min(int(round(start)), int(round(end)))

class Camera(object):
    width = 224
    height = 224
    def __init__(self, *args, **kwargs):
        pass
    @classmethod
    def instance(cls, *args, **kwargs):
        return cls()
    def line_position(self):
        return _sim.line_position()
    def sees_line(self):
        return _sim.line_position() is not None
    def color(self):
        return _sim.color()
    def _get_value(self):
        return CameraImage(_sim.ai_capture())
    value = property(_get_value)
    def show(self):
        _sim.ai_show(_sim.ai_capture())
    def stop(self):
        pass

class CameraImage(object):
    """Anh 224x224 chup tu camera robot"""
    def __init__(self, fid):
        self._id = fid
    def show(self):
        _sim.ai_show(self._id)
    def __repr__(self):
        return "<CameraImage 224x224>"

class Dataset(object):
    """Bo du lieu anh gom 2 thu muc: free va blocked"""
    def __init__(self, name='dataset'):
        self.name = str(name)
    def add(self, label, image=None):
        if label != 'free' and label != 'blocked':
            raise ValueError("label: 'free' / 'blocked'")
        return _sim.ai_add(self.name, label, -1 if image is None else image._id)
    def add_free(self, image=None):
        return self.add('free', image)
    def add_blocked(self, image=None):
        return self.add('blocked', image)
    def count(self, label=None):
        return _sim.ai_count(self.name, '' if label is None else str(label))
    def __len__(self):
        return self.count()
    def remove_last(self):
        _sim.ai_pop(self.name)
    def clear(self):
        _sim.ai_clear(self.name)
    def show(self, n=12):
        _sim.ai_gallery(self.name, int(n))
    def widget(self):
        _sim.ai_widget(self.name)

class CollisionModel(object):
    """Mang no-ron phan loai anh camera: blocked / free"""
    def __init__(self, hidden=32):
        self._h = _sim.ai_model_new(int(hidden))
    def train(self, dataset, epochs=30, test_size=0.2, lr=0.001):
        return _sim.ai_train(self._h, dataset.name, int(epochs), float(test_size), float(lr))
    def save(self, path='collision_model.pth'):
        _sim.ai_save(self._h, str(path))
    def load(self, path='collision_model.pth'):
        _sim.ai_load(self._h, str(path))
        return self
    def predict(self, image=None):
        return _sim.ai_predict(self._h, -1 if image is None else image._id)
    def __call__(self, image=None):
        return self.predict(image)

class OLED(object):
    def __init__(self, *args, **kwargs):
        pass
    def text(self, s, line=0):
        _sim.oled_text(str(s), int(line))
    def clear(self):
        _sim.oled_clear()
`;
const SIM_JS = `var $builtinmodule = function(name){
  var S = window.SIM, js = Sk.ffi.remapToJs, py = Sk.ffi.remapToPy, N = Sk.builtin.none.none$;
  var m = { __name__: new Sk.builtin.str("_sim") };
  function f(n, fn){ m[n] = new Sk.builtin.func(fn); }
  function fl(v){ return new Sk.builtin.float_(v); }
  f("set_motors", function(l, r){ S.setMotors(js(l), js(r)); return N; });
  f("set_motor", function(i, v){ S.setMotor(js(i), js(v)); return N; });
  f("get_motor", function(i){ return fl(S.cmd[js(i) ? 1 : 0]); });
  f("sleep", function(t){ return Sk.misceval.promiseToSuspension(S.sleep(js(t)).then(function(){ return N; })); });
  f("bumped", function(){ return S.bumpT > 0 ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$; });
  f("encoder", function(i){ return new Sk.builtin.int_(Math.round(js(i) ? S.encR : S.encL)); });
  f("encoder_reset", function(){ S.encL = 0; S.encR = 0; return N; });
  f("wheel_speed", function(){ return py([Math.round(S.vl*1000)/1000, Math.round(S.vr*1000)/1000]); });
  f("imu_yaw", function(){ return fl(Math.round(S.yaw*100)/100); });
  f("imu_gyro", function(){ return fl(Math.round(S.gyro*100)/100); });
  f("imu_accel", function(){ return py([Math.round(S.ax*100)/100, Math.round(S.ay*100)/100, 9.81]); });
  f("imu_reset", function(){ S.yaw = 0; return N; });
  f("lidar_scan", function(){ return py(S.lidarScan()); });
  f("lidar_at", function(i){ return fl(S.lidarAt(js(i))); });
  f("lidar_min", function(a, b){ return fl(S.lidarMin(js(a), js(b))); });
  f("line_position", function(){ var v = S.linePos(); return v === null ? N : fl(v); });
  f("color", function(){ var c = S.color(); return c ? new Sk.builtin.str(c) : N; });
  f("oled_text", function(s, l){ S.oledText(js(s), js(l)); return N; });
  f("oled_clear", function(){ S.oledClear(); return N; });
  var A = window.AIJS, I = function(v){ return new Sk.builtin.int_(v); };
  function err(e){ return e instanceof Error ? new Sk.builtin.ValueError(e.message) : e; }
  function g(n, fn){ m[n] = new Sk.builtin.func(function(){ try { return fn.apply(null, arguments); } catch (e) { throw err(e); } }); }
  g("ai_capture", function(){ return I(A.capture()); });
  g("ai_show", function(id){ A.show(js(id)); return N; });
  g("ai_add", function(n, l, id){ return I(A.add(js(n), js(l), js(id))); });
  g("ai_count", function(n, l){ return I(A.count(js(n), js(l))); });
  g("ai_pop", function(n){ A.pop(js(n)); return N; });
  g("ai_clear", function(n){ A.clear(js(n)); return N; });
  g("ai_gallery", function(n, k){ A.gallery(js(n), js(k)); return N; });
  g("ai_widget", function(n){ A.widget(js(n)); return N; });
  g("ai_model_new", function(h){ return I(A.newModel(js(h))); });
  g("ai_train", function(h, n, e, ts, lr){ return Sk.misceval.promiseToSuspension(A.train(js(h), js(n), js(e), js(ts), js(lr)).then(function(v){ return fl(v); }, function(e){ throw err(e); })); });
  g("ai_save", function(h, p){ A.save(js(h), js(p)); return N; });
  g("ai_load", function(h, p){ A.load(js(h), js(p)); return N; });
  g("ai_predict", function(h, id){ return fl(A.predict(js(h), js(id))); });
  return m;
};`;
const TIME_JS = `var $builtinmodule = function(name){
  var S = window.SIM, m = { __name__: new Sk.builtin.str("time") };
  m.sleep = new Sk.builtin.func(function(t){
    if (t === undefined) throw new Sk.builtin.TypeError("sleep() cần 1 tham số: số giây");
    return Sk.misceval.promiseToSuspension(S.sleep(Sk.ffi.remapToJs(t)).then(function(){ return Sk.builtin.none.none$; }));
  });
  m.time = new Sk.builtin.func(function(){ return new Sk.builtin.float_(Math.round((S.t - S.t0)*1000)/1000); });
  m.monotonic = m.time; m.perf_counter = m.time;
  return m;
};`;
const PYLIB = { "src/lib/jetbot.py": JETBOT_PY, "src/lib/_sim.js": SIM_JS, "src/lib/time.js": TIME_JS };
// Chỉ cho phép thư viện an toàn: không DOM, không mạng, không chạy JavaScript.
const PY_ALLOWED = new Set(["jetbot","_sim","time","math","random","re","string","collections","itertools","functools","operator","copy","bisect","heapq","array","keyword","textwrap","datetime","numbers","abc","types","__future__","fractions","json"]);
function pyRead(x){
  if (PYLIB[x] !== undefined) return PYLIB[x];
  const m = /^src\/lib\/([^\/.]+)/.exec(x);
  if (m && !PY_ALLOWED.has(m[1])) throw "File not found: '" + x + "'";
  if (!Sk.builtinFiles || Sk.builtinFiles.files[x] === undefined) throw "File not found: '" + x + "'";
  return Sk.builtinFiles.files[x];
}

/* =====================================================================
   4. BÀI MẪU
   ===================================================================== */
const LESSONS = [
 { id:"l1", tag:"Cơ bản", title:"1. Làm quen: tiến, quay, dừng", desc:"Khởi tạo Robot, điều khiển bằng forward / left / stop.", map:"open", file:"bai-01-lam-quen.ipynb", cells:[
  ["md","# Bài 1 · Làm quen với JetBot\nKhởi tạo robot rồi cho robot tiến, quay và dừng.\n- Chọn một ô và nhấn **Shift + Enter** để chạy rồi chuyển xuống ô dưới.\n- Tốc độ động cơ từ `-1.0` (lùi hết cỡ) đến `1.0` (tiến hết cỡ)."],
  ["code","from jetbot import Robot\nimport time\n\nrobot = Robot()\nprint(\"JetBot đã sẵn sàng!\")"],
  ["code","robot.forward(0.4)   # tiến với 40% tốc độ\ntime.sleep(1.5)\nrobot.stop()"],
  ["code","robot.left(0.3)      # quay trái tại chỗ\ntime.sleep(0.74)     # ≈ 90°\nrobot.stop()"],
  ["md","> Động cơ giữ nguyên lệnh cuối cùng cho tới khi gọi `robot.stop()`, giống robot thật. Nhấn **Dừng** nếu robot chạy mãi."]]},
 { id:"l2", tag:"Vòng lặp", title:"2. Vòng lặp: đi hình vuông", desc:"Dùng for để lặp 4 cạnh. Bật Vết để thấy hình vẽ.", map:"open", file:"bai-02-hinh-vuong.ipynb", cells:[
  ["md","# Bài 2 · Đi theo hình vuông\nLặp 4 lần: đi thẳng rồi quay phải. Bật **Vết** và **Trục Oxyz** trên sa bàn để xem đường đi và hướng robot.\n\nThời gian quay 90° tại chỗ: `t = (π/2 · d/2) / (tốc_độ · v_max)` với khoảng cách hai bánh `d = 0.17 m`, `v_max = 0.6 m/s`. Với `right(0.3)`: `t = 0.1335 / 0.18 ≈ 0.74 s`."],
  ["code","from jetbot import Robot\nimport time\nrobot = Robot()\n\nfor canh in range(4):\n    robot.forward(0.4)\n    time.sleep(1.2)\n    robot.right(0.3)\n    time.sleep(0.74)   # 0.74 s ≈ 90°\nrobot.stop()\nprint(\"Xong hình vuông\")"]]},
 { id:"l3", tag:"Động cơ", title:"3. Điều khiển từng động cơ", desc:"set_motors và left_motor.value để rẽ theo cung tròn.", map:"open", file:"bai-03-dong-co.ipynb", cells:[
  ["md","# Bài 3 · Điều khiển vi sai\nKhi hai bánh quay khác tốc độ, robot rẽ theo cung tròn. Bánh nào nhanh hơn thì robot rẽ về phía bên kia."],
  ["code","from jetbot import Robot\nimport time\nrobot = Robot()\n\nrobot.set_motors(0.5, 0.25)   # trái nhanh hơn → rẽ phải\ntime.sleep(3)\nrobot.stop()"],
  ["code","# Cách viết giống thư viện JetBot gốc\nrobot.left_motor.value = 0.25\nrobot.right_motor.value = 0.5\ntime.sleep(3)\nrobot.stop()"]]},
 { id:"l4", tag:"Encoder", title:"4. Encoder: đi đúng 50 cm", desc:"Đếm xung encoder để đo quãng đường thay vì đoán thời gian.", map:"open", file:"bai-04-encoder.ipynb", cells:[
  ["md","# Bài 4 · Đo quãng đường bằng encoder\nMỗi vòng bánh xe cho `1320` xung. Bánh có đường kính `6.5 cm`, nên 1 xung ≈ `0.155 mm`. Hàm `enc.distance()` đổi sẵn ra mét."],
  ["code","from jetbot import Robot, Encoder\nimport time\nrobot = Robot()\nenc = Encoder()\nenc.reset()\n\nrobot.forward(0.35)\nwhile True:\n    trai, phai = enc.distance()\n    if (trai + phai) / 2 >= 0.50:\n        break\n    time.sleep(0.01)\nrobot.stop()\n\nprint(\"Xung encoder (trái, phải):\", enc.read())\nprint(\"Quãng đường:\", round((trai + phai) / 2 * 100, 1), \"cm\")"],
  ["md","**Thử thách:** viết hàm `di_thang(cm)` rồi đi một hình chữ nhật 60 × 30 cm."]]},
 { id:"l5", tag:"IMU", title:"5. IMU: quay chính xác 90°", desc:"Đọc góc yaw từ cảm biến IMU, thêm bộ điều khiển P.", map:"open", file:"bai-05-imu.ipynb", cells:[
  ["md","# Bài 5 · Quay theo góc IMU\n`imu.yaw()` trả về góc đã quay (độ) kể từ lần `reset()`. Quay trái là góc dương."],
  ["code","from jetbot import Robot, IMU\nimport time\nrobot = Robot()\nimu = IMU()\nimu.reset()\n\nrobot.left(0.25)\nwhile imu.yaw() < 90:\n    time.sleep(0.01)\nrobot.stop()\ntime.sleep(0.3)\nprint(\"Góc cuối:\", imu.yaw(), \"độ\")"],
  ["code","# Bộ điều khiển P: càng gần đích quay càng chậm\nmuc_tieu = imu.yaw() + 90\nKP = 0.012\nwhile True:\n    sai_so = muc_tieu - imu.yaw()\n    if abs(sai_so) < 0.5:\n        break\n    toc_do = max(-0.4, min(0.4, KP * sai_so))\n    robot.set_motors(-toc_do, toc_do)\n    time.sleep(0.02)\nrobot.stop()\nprint(\"Sai số:\", round(muc_tieu - imu.yaw(), 2), \"độ\")"]]},
 { id:"l6", tag:"Lidar", title:"6. Lidar: đọc bản quét 360°", desc:"Mỗi phần tử là khoảng cách (m) theo một góc.", map:"obst", file:"bai-06-lidar.ipynb", cells:[
  ["md","# Bài 6 · Đọc Lidar\n`lidar.scan()` trả về danh sách 360 khoảng cách (mét). Chỉ số là góc: `0` phía trước, `90` bên trái, `180` phía sau, `270` bên phải."],
  ["code","from jetbot import Lidar\nlidar = Lidar()\n\nscan = lidar.scan()\nprint(\"Số điểm:\", len(scan))\nprint(\"Trước  (0°):  \", scan[0], \"m\")\nprint(\"Trái   (90°): \", scan[90], \"m\")\nprint(\"Sau    (180°):\", scan[180], \"m\")\nprint(\"Phải   (270°):\", scan[270], \"m\")\nprint(\"Gần nhất trong ±30° phía trước:\", lidar.min_distance(-30, 30), \"m\")"]]},
 { id:"l7", tag:"Lidar", title:"7. Lidar: tránh vật cản", desc:"Phát hiện chướng ngại phía trước rồi chọn hướng thoáng hơn.", map:"obst", file:"bai-07-tranh-vat-can.ipynb", cells:[
  ["md","# Bài 7 · Tránh vật cản\nNếu phía trước gần hơn `0.25 m`, so sánh hai bên rồi quay về phía thoáng hơn. Mục tiêu: đến ô **xanh lá** góc trên bên phải."],
  ["code","from jetbot import Robot, Lidar, Camera\nimport time\nrobot = Robot()\nlidar = Lidar()\ncamera = Camera()\n\nfor buoc in range(800):\n    if camera.color() == \"green\":\n        print(\"Đã tới đích sau\", buoc, \"bước\")\n        break\n    truoc = lidar.min_distance(-25, 25)\n    if truoc < 0.25:\n        trai = lidar.min_distance(30, 90)\n        phai = lidar.min_distance(-90, -30)\n        if trai > phai:\n            robot.left(0.3)\n        else:\n            robot.right(0.3)\n    else:\n        robot.forward(0.35)\n    time.sleep(0.05)\nrobot.stop()"]]},
 { id:"l8", tag:"Camera", title:"8. Camera: dò line", desc:"Bộ điều khiển P bám theo vạch đen trên sa bàn.", map:"line", file:"bai-08-do-line.ipynb", cells:[
  ["md","# Bài 8 · Dò line bằng camera\n`camera.line_position()` cho biết vạch đen lệch bao nhiêu: `-1` bên trái, `0` chính giữa, `+1` bên phải, `None` nếu không thấy vạch."],
  ["code","from jetbot import Robot, Camera\nimport time\nrobot = Robot()\ncamera = Camera()\nprint(\"Độ lệch line hiện tại:\", camera.line_position())"],
  ["code","TOC_DO = 0.3\nKP = 0.35\nfor i in range(1200):\n    lech = camera.line_position()\n    if lech is None:\n        robot.set_motors(0.15, -0.15)   # mất line: xoay tìm\n    else:\n        robot.set_motors(TOC_DO + KP * lech, TOC_DO - KP * lech)\n    if camera.color() == \"red\" and i > 100:\n        print(\"Về vạch đỏ, hoàn thành 1 vòng!\")\n        break\n    time.sleep(0.03)\nrobot.stop()"],
  ["md","**Thử thách:** tăng `TOC_DO` lên `0.5`. Robot còn bám line không? Cần chỉnh `KP` thế nào?"]]},
 { id:"l9", tag:"Thử thách", title:"9. Mê cung: bám tường phải", desc:"Giữ khoảng cách cố định với tường bên phải để thoát mê cung.", map:"maze", file:"bai-09-me-cung.ipynb", cells:[
  ["md","# Bài 9 · Thoát mê cung\nQuy tắc bàn tay phải: luôn giữ tường ở bên phải. Đích là ô **xanh lá** góc dưới bên phải. Hãy chỉnh `KHOANG_CACH` và `KP` để robot đi êm hơn."],
  ["code","from jetbot import Robot, Lidar, Camera\nimport time\nrobot = Robot()\nlidar = Lidar()\ncamera = Camera()\n\nKHOANG_CACH = 0.2\nKP = 1.2\nfor i in range(3000):\n    if camera.color() == \"green\":\n        print(\"Thoát mê cung!\")\n        break\n    truoc = lidar.min_distance(-20, 20)\n    phai = lidar.min_distance(-100, -60)\n    if truoc < 0.22:\n        robot.left(0.3)\n    else:\n        sai = max(-0.25, min(0.25, phai - KHOANG_CACH))\n        robot.set_motors(0.3 + KP * sai, 0.3 - KP * sai)\n    time.sleep(0.03)\nrobot.stop()"]]},
 { id:"l10", tag:"Tổng hợp", title:"10. OLED: hiển thị cảm biến", desc:"In giá trị cảm biến lên màn hình OLED trên robot.", map:"open", file:"bai-10-oled.ipynb", cells:[
  ["md","# Bài 10 · Màn hình OLED\nMàn OLED 128×32 có 4 dòng (`0` đến `3`). Chọn chế độ **Lái phím** rồi điều khiển robot để xem số liệu đổi theo."],
  ["code","from jetbot import OLED, IMU, Encoder, Lidar\nimport time\noled = OLED()\nimu = IMU()\nenc = Encoder()\nlidar = Lidar()\n\nfor i in range(300):\n    oled.text(\"Yaw: \" + str(round(imu.yaw())) + \" do\", 0)\n    oled.text(\"Enc: \" + str(enc.left()) + \"/\" + str(enc.right()), 1)\n    oled.text(\"Truoc: \" + str(lidar.distance(0)) + \" m\", 2)\n    oled.text(\"t = \" + str(round(time.time(), 1)) + \" s\", 3)\n    time.sleep(0.1)"]]},
 { id:"l11", tag:"AI", title:"11. AI tránh vật cản ①: thu thập dữ liệu", desc:"Chụp ảnh camera, gán nhãn free / blocked để dạy robot.", map:"arena", file:"bai-11-thu-thap-du-lieu.ipynb", cells:[
  ["md", "# Bài 11 · Tránh vật cản bằng AI ①: Thu thập dữ liệu\nRobot chỉ dùng **camera** để tự tránh vật cản và **không vượt ra ngoài vạch đen**. Bài toán chia làm 3 bước, giống bộ notebook *collision_avoidance* của JetBot:\n1. **Thu thập dữ liệu** (bài này): chụp ảnh và gán nhãn `free` / `blocked`.\n2. **Huấn luyện** (bài 12): dạy mạng nơ-ron phân loại ảnh.\n3. **Chạy mô hình** (bài 13): robot tự chạy.\n\nÝ tưởng: tạo một **vùng an toàn** quanh robot. Vật cản hoặc vạch đen lọt vào vùng này thì gán `blocked`; robot còn đi thẳng được một đoạn thì gán `free`.\n> Khi quay tại chỗ, JetBot quay quanh **điểm giữa hai bánh xe** (gốc trục Oxyz), không phải tâm khung xe. Nếu phân vân, hãy chọn `blocked` (vùng an toàn rộng hơn)."],
  ["md", "### Xem ảnh camera\nMạng nơ-ron nhận ảnh **224×224**. Chạy ô dưới để xem robot đang thấy gì."],
  ["code", "from jetbot import Camera, Dataset\n\ncamera = Camera.instance(width=224, height=224)\ncamera.value.show()"],
  ["md", "### Tạo bộ dữ liệu\nBộ dữ liệu `dataset` có 2 thư mục: `free` và `blocked`. Ảnh được lưu trong trình duyệt, mở lại trang vẫn còn."],
  ["code", "dataset = Dataset('dataset')\nprint('free:', dataset.count('free'), '· blocked:', dataset.count('blocked'))"],
  ["md", "### Chụp ảnh và gán nhãn\nChạy ô dưới để hiện ảnh camera trực tiếp và hai nút, rồi lặp lại:\n1. Đặt robot vào chỗ **bị chặn** (sát vật cản hoặc sát vạch đen), bấm **add blocked**.\n2. Đặt robot vào chỗ **thoáng**, bấm **add free**.\n\nCách đặt robot: dùng các nút **↺ ↻** để xoay và **↑ ↓** để tiến lùi ngay dưới ảnh camera, hoặc **kéo robot bằng chuột trái** (cuộn chuột khi đang kéo để xoay).\n\nMuốn đổi bố trí sa bàn: bật **Sửa vật cản**, bấm vào nền để **đặt khối**, bấm vào khối để **xoá**. Nút **Khôi phục** đưa sa bàn về như cũ.\n\nMẹo: thử nhiều hướng, nhiều khoảng cách, vật cản bên trái / bên phải, vạch đen ở cạnh và ở góc. Nên có ít nhất **50 ảnh mỗi loại**, hai loại gần bằng nhau."],
  ["code", "dataset.widget()"],
  ["md", "> Lỡ gán sai thì bấm **Xoá ảnh vừa thêm**. Muốn làm lại từ đầu: `dataset.clear()`.\n\nĐủ ảnh rồi thì chuyển sang **Bài 12** để huấn luyện."]]},
 { id:"l12", tag:"AI", title:"12. AI tránh vật cản ②: huấn luyện", desc:"Huấn luyện mạng nơ-ron phân loại ảnh free / blocked.", map:"arena", file:"bai-12-huan-luyen.ipynb", cells:[
  ["md", "# Bài 12 · Tránh vật cản bằng AI ②: Huấn luyện mô hình\nTa dạy một **mạng nơ-ron** nhìn ảnh camera rồi đoán `blocked` hay `free`.\n\nJetBot thật dùng *PyTorch* với mạng **resnet18** chạy trên GPU. Trình duyệt không có GPU nên mô phỏng dùng mạng nhỏ hơn: ảnh thu về **16×16 điểm màu** (768 số) → **1 lớp ẩn 32 nơ-ron** → **2 lớp ra**: `blocked`, `free`. Cách học vẫn giống: chia tập train / test, lặp nhiều *epoch*, giữ lại mô hình tốt nhất."],
  ["md", "### 1. Nạp bộ dữ liệu"],
  ["code", "from jetbot import Dataset, CollisionModel\n\ndataset = Dataset('dataset')\nprint('free:', dataset.count('free'), '· blocked:', dataset.count('blocked'))\ndataset.show(16)    # 16 ảnh mới nhất"],
  ["md", "### 2. Tạo mạng nơ-ron\nTrọng số ban đầu là số ngẫu nhiên, mô hình chưa biết gì."],
  ["code", "model = CollisionModel(hidden=32)"],
  ["md", "### 3. Huấn luyện\nMỗi *epoch*, mạng học hết ảnh train một lượt (ảnh được đổi độ sáng và lật ngang ngẫu nhiên, giống `ColorJitter`). Sau mỗi epoch in **độ chính xác trên tập test** (từ 0 đến 1). Mô hình tốt nhất được giữ lại."],
  ["code", "NUM_EPOCHS = 30\nBEST_MODEL_PATH = 'collision_model.pth'\n\nbest_accuracy = model.train(dataset, epochs=NUM_EPOCHS, test_size=0.2)\nmodel.save(BEST_MODEL_PATH)\nprint('Độ chính xác tốt nhất:', best_accuracy)"],
  ["md", "**Thử thách:** độ chính xác thấp? Thu thêm ảnh ở những chỗ robot hay đoán sai, thử `hidden=64` hoặc tăng `NUM_EPOCHS`.\n\nTiếp theo: **Bài 13** để robot tự chạy bằng mô hình vừa lưu."]]},
 { id:"l13", tag:"AI", title:"13. AI tránh vật cản ③: chạy mô hình", desc:"Robot tự tránh vật cản, giữ trong vạch đen chỉ bằng camera.", map:"arena", file:"bai-13-chay-mo-hinh.ipynb", cells:[
  ["md", "# Bài 13 · Tránh vật cản bằng AI ③: Chạy mô hình\nDùng mô hình đã huấn luyện để robot tự chạy. Mỗi khung hình, mạng nơ-ron đoán **xác suất bị chặn** `prob_blocked`:\n- `prob_blocked < 0.5`: đi thẳng.\n- ngược lại: quay trái.\n\nThanh **blocked** phía trên khung Camera hiện xác suất này theo thời gian thực."],
  ["md", "### 1. Nạp mô hình"],
  ["code", "from jetbot import Robot, Camera, CollisionModel\nimport time\n\nrobot = Robot()\ncamera = Camera.instance(width=224, height=224)\n\nmodel = CollisionModel()\nmodel.load('collision_model.pth')\nprint('prob_blocked hiện tại =', model.predict(camera.value))"],
  ["md", "### 2. Chạy\n> Robot sẽ di chuyển! Bấm **Dừng** để dừng. Nếu robot ra ngoài vạch đen, sa bàn sẽ báo."],
  ["code", "speed = 0.25\n\nfor i in range(1500):\n    prob_blocked = model.predict(camera.value)\n    if prob_blocked < 0.5:\n        robot.forward(speed)\n    else:\n        robot.left(speed)\n    time.sleep(0.05)\n\nrobot.stop()"],
  ["md", "### Kết luận\nRobot vẫn va chạm hoặc ra ngoài vạch? Để ý **chỗ nó sai**, quay lại **Bài 11** thu thêm ảnh đúng những tình huống đó rồi huấn luyện lại. Dữ liệu càng nhiều và đa dạng, robot càng giỏi.\n\n**Thử thách:** tăng `speed` lên `0.4`. Cần thêm dữ liệu gì để robot vẫn an toàn?"]]}
];
const LESSONS_EN = {"l1": {"tag": "Basics", "title": "1. Getting started: drive, turn, stop", "desc": "Create a Robot and control it with forward / left / stop.", "file": "lesson-01-getting-started.ipynb", "cells": [["md", "# Lesson 1 · Meet JetBot\nCreate the robot, then drive forward, turn and stop.\n- Select a cell and press **Shift + Enter** to run it and move to the next one.\n- Motor speed goes from `-1.0` (full reverse) to `1.0` (full forward)."], ["code", "from jetbot import Robot\nimport time\n\nrobot = Robot()\nprint(\"JetBot is ready!\")"], ["code", "robot.forward(0.4)   # drive forward at 40% speed\ntime.sleep(1.5)\nrobot.stop()"], ["code", "robot.left(0.3)      # spin left in place\ntime.sleep(0.74)     # ≈ 90°\nrobot.stop()"], ["md", "> The motors keep their last command until you call `robot.stop()`, just like the real robot. Press **Stop** if the robot keeps going."]]}, "l2": {"tag": "Loops", "title": "2. Loops: drive a square", "desc": "Use for to repeat 4 sides. Turn on Trail to see the shape.", "file": "lesson-02-square.ipynb", "cells": [["md", "# Lesson 2 · Drive a square\nRepeat 4 times: drive straight, then turn right. Turn on **Trail** and **Axes** to see the path and the robot's heading.\n\nTime to spin 90° in place: `t = (π/2 · d/2) / (speed · v_max)` with wheel spacing `d = 0.17 m`, `v_max = 0.6 m/s`. For `right(0.3)`: `t = 0.1335 / 0.18 ≈ 0.74 s`."], ["code", "from jetbot import Robot\nimport time\nrobot = Robot()\n\nfor side in range(4):\n    robot.forward(0.4)\n    time.sleep(1.2)\n    robot.right(0.3)\n    time.sleep(0.74)   # 0.74 s ≈ 90°\nrobot.stop()\nprint(\"Square done\")"]]}, "l3": {"tag": "Motors", "title": "3. Controlling each motor", "desc": "set_motors and left_motor.value to drive along an arc.", "file": "lesson-03-motors.ipynb", "cells": [["md", "# Lesson 3 · Differential drive\nWhen the two wheels spin at different speeds, the robot follows an arc. It turns away from the faster wheel."], ["code", "from jetbot import Robot\nimport time\nrobot = Robot()\n\nrobot.set_motors(0.5, 0.25)   # left is faster → turn right\ntime.sleep(3)\nrobot.stop()"], ["code", "# Same style as the original JetBot library\nrobot.left_motor.value = 0.25\nrobot.right_motor.value = 0.5\ntime.sleep(3)\nrobot.stop()"]]}, "l4": {"tag": "Encoder", "title": "4. Encoder: drive exactly 50 cm", "desc": "Count encoder ticks to measure distance instead of guessing time.", "file": "lesson-04-encoder.ipynb", "cells": [["md", "# Lesson 4 · Measuring distance with encoders\nOne wheel turn gives `1320` ticks. The wheel is `6.5 cm` across, so 1 tick ≈ `0.155 mm`. `enc.distance()` already converts to metres."], ["code", "from jetbot import Robot, Encoder\nimport time\nrobot = Robot()\nenc = Encoder()\nenc.reset()\n\nrobot.forward(0.35)\nwhile True:\n    left_m, right_m = enc.distance()\n    if (left_m + right_m) / 2 >= 0.50:\n        break\n    time.sleep(0.01)\nrobot.stop()\n\nprint(\"Encoder ticks (left, right):\", enc.read())\nprint(\"Distance:\", round((left_m + right_m) / 2 * 100, 1), \"cm\")"], ["md", "**Challenge:** write a function `drive_straight(cm)` and drive a 60 × 30 cm rectangle."]]}, "l5": {"tag": "IMU", "title": "5. IMU: turn exactly 90°", "desc": "Read the yaw angle from the IMU, then add a P controller.", "file": "lesson-05-imu.ipynb", "cells": [["md", "# Lesson 5 · Turning with the IMU\n`imu.yaw()` returns the angle turned (degrees) since the last `reset()`. Turning left is positive."], ["code", "from jetbot import Robot, IMU\nimport time\nrobot = Robot()\nimu = IMU()\nimu.reset()\n\nrobot.left(0.25)\nwhile imu.yaw() < 90:\n    time.sleep(0.01)\nrobot.stop()\ntime.sleep(0.3)\nprint(\"Final angle:\", imu.yaw(), \"degrees\")"], ["code", "# P controller: the closer to the target, the slower it turns\ntarget = imu.yaw() + 90\nKP = 0.012\nwhile True:\n    error = target - imu.yaw()\n    if abs(error) < 0.5:\n        break\n    speed = max(-0.4, min(0.4, KP * error))\n    robot.set_motors(-speed, speed)\n    time.sleep(0.02)\nrobot.stop()\nprint(\"Error:\", round(target - imu.yaw(), 2), \"degrees\")"]]}, "l6": {"tag": "Lidar", "title": "6. Lidar: read a 360° scan", "desc": "Each item is the distance (m) at one angle.", "file": "lesson-06-lidar.ipynb", "cells": [["md", "# Lesson 6 · Reading the Lidar\n`lidar.scan()` returns a list of 360 distances (metres). The index is the angle: `0` front, `90` left, `180` back, `270` right."], ["code", "from jetbot import Lidar\nlidar = Lidar()\n\nscan = lidar.scan()\nprint(\"Points:\", len(scan))\nprint(\"Front (0°):  \", scan[0], \"m\")\nprint(\"Left  (90°): \", scan[90], \"m\")\nprint(\"Back  (180°):\", scan[180], \"m\")\nprint(\"Right (270°):\", scan[270], \"m\")\nprint(\"Closest within ±30° in front:\", lidar.min_distance(-30, 30), \"m\")"]]}, "l7": {"tag": "Lidar", "title": "7. Lidar: avoid obstacles", "desc": "Detect obstacles ahead and turn toward the clearer side.", "file": "lesson-07-obstacles.ipynb", "cells": [["md", "# Lesson 7 · Obstacle avoidance\nIf something is closer than `0.25 m` ahead, compare both sides and turn toward the clearer one. Goal: reach the **green** square in the top-right corner."], ["code", "from jetbot import Robot, Lidar, Camera\nimport time\nrobot = Robot()\nlidar = Lidar()\ncamera = Camera()\n\nfor step in range(800):\n    if camera.color() == \"green\":\n        print(\"Reached the goal after\", step, \"steps\")\n        break\n    front = lidar.min_distance(-25, 25)\n    if front < 0.25:\n        left = lidar.min_distance(30, 90)\n        right = lidar.min_distance(-90, -30)\n        if left > right:\n            robot.left(0.3)\n        else:\n            robot.right(0.3)\n    else:\n        robot.forward(0.35)\n    time.sleep(0.05)\nrobot.stop()"]]}, "l8": {"tag": "Camera", "title": "8. Camera: line following", "desc": "A P controller that follows the black line on the field.", "file": "lesson-08-line-following.ipynb", "cells": [["md", "# Lesson 8 · Line following with the camera\n`camera.line_position()` tells you how far the black line is off centre: `-1` left, `0` centre, `+1` right, `None` if no line is seen."], ["code", "from jetbot import Robot, Camera\nimport time\nrobot = Robot()\ncamera = Camera()\nprint(\"Current line offset:\", camera.line_position())"], ["code", "SPEED = 0.3\nKP = 0.35\nfor i in range(1200):\n    offset = camera.line_position()\n    if offset is None:\n        robot.set_motors(0.15, -0.15)   # line lost: spin to search\n    else:\n        robot.set_motors(SPEED + KP * offset, SPEED - KP * offset)\n    if camera.color() == \"red\" and i > 100:\n        print(\"Back at the red mark, one lap done!\")\n        break\n    time.sleep(0.03)\nrobot.stop()"], ["md", "**Challenge:** raise `SPEED` to `0.5`. Does the robot still follow the line? How should you change `KP`?"]]}, "l9": {"tag": "Challenge", "title": "9. Maze: right-wall following", "desc": "Keep a fixed distance to the right wall to escape the maze.", "file": "lesson-09-maze.ipynb", "cells": [["md", "# Lesson 9 · Escape the maze\nRight-hand rule: always keep a wall on your right. The goal is the **green** square in the bottom-right corner. Tune `DISTANCE` and `KP` for a smoother run."], ["code", "from jetbot import Robot, Lidar, Camera\nimport time\nrobot = Robot()\nlidar = Lidar()\ncamera = Camera()\n\nDISTANCE = 0.2\nKP = 1.2\nfor i in range(3000):\n    if camera.color() == \"green\":\n        print(\"Out of the maze!\")\n        break\n    front = lidar.min_distance(-20, 20)\n    right = lidar.min_distance(-100, -60)\n    if front < 0.22:\n        robot.left(0.3)\n    else:\n        err = max(-0.25, min(0.25, right - DISTANCE))\n        robot.set_motors(0.3 + KP * err, 0.3 - KP * err)\n    time.sleep(0.03)\nrobot.stop()"]]}, "l10": {"tag": "Projects", "title": "10. OLED: show sensor data", "desc": "Print sensor values on the robot's OLED screen.", "file": "lesson-10-oled.ipynb", "cells": [["md", "# Lesson 10 · OLED display\nThe 128×32 OLED has 4 lines (`0` to `3`). Turn on **Drive** mode and steer the robot to watch the numbers change."], ["code", "from jetbot import OLED, IMU, Encoder, Lidar\nimport time\noled = OLED()\nimu = IMU()\nenc = Encoder()\nlidar = Lidar()\n\nfor i in range(300):\n    oled.text(\"Yaw: \" + str(round(imu.yaw())) + \" deg\", 0)\n    oled.text(\"Enc: \" + str(enc.left()) + \"/\" + str(enc.right()), 1)\n    oled.text(\"Front: \" + str(lidar.distance(0)) + \" m\", 2)\n    oled.text(\"t = \" + str(round(time.time(), 1)) + \" s\", 3)\n    time.sleep(0.1)"]]}, "l11": {"tag": "AI", "title": "11. AI obstacle avoidance ①: data collection", "desc": "Take camera snapshots and label them free / blocked.", "file": "lesson-11-data-collection.ipynb", "cells": [["md", "# Lesson 11 · AI obstacle avoidance ①: Data collection\nThe robot uses only its **camera** to avoid obstacles and **stay inside the black line**. Like JetBot's *collision_avoidance* notebooks, the job has 3 steps:\n1. **Data collection** (this lesson): take snapshots and label them `free` / `blocked`.\n2. **Training** (lesson 12): teach a neural network to classify the images.\n3. **Run the model** (lesson 13): the robot drives by itself.\n\nThe idea: imagine a **safety bubble** around the robot. If an obstacle or the black line is inside it, label `blocked`; if the robot can still drive forward a bit, label `free`.\n> When JetBot spins in place it turns about the **point between the two wheels** (the Oxyz origin), not the centre of the chassis. If in doubt, choose `blocked` (a bigger bubble)."], ["md", "### See the camera image\nThe network takes **224×224** images. Run the cell below to see what the robot sees."], ["code", "from jetbot import Camera, Dataset\n\ncamera = Camera.instance(width=224, height=224)\ncamera.value.show()"], ["md", "### Create the dataset\nThe `dataset` has 2 folders: `free` and `blocked`. Images are kept in the browser, so they survive a page reload."], ["code", "dataset = Dataset('dataset')\nprint('free:', dataset.count('free'), '· blocked:', dataset.count('blocked'))"], ["md", "### Take and label snapshots\nRun the cell below to show the live camera and two buttons, then repeat:\n1. Put the robot where it is **blocked** (close to an obstacle or the black line), press **add blocked**.\n2. Put the robot where it is **free**, press **add free**.\n\nTo place the robot: use the **↺ ↻** buttons to rotate and **↑ ↓** to move, right under the camera image, or **drag it with the left mouse button** (scroll while dragging to rotate).\n\nTo change the layout: turn on **Edit obstacles**, click the floor to **add a block**, click a block to **remove it**. **Reset** restores the original field.\n\nTips: try many headings and distances, obstacles on the left and right, the line along edges and in corners. Aim for at least **50 images per class**, roughly balanced."], ["code", "dataset.widget()"], ["md", "> Labelled one wrong? Press **Remove last image**. To start over: `dataset.clear()`.\n\nOnce you have enough images, go to **Lesson 12** to train."]]}, "l12": {"tag": "AI", "title": "12. AI obstacle avoidance ②: training", "desc": "Train a neural network to classify free / blocked images.", "file": "lesson-12-train-model.ipynb", "cells": [["md", "# Lesson 12 · AI obstacle avoidance ②: Train the model\nWe teach a **neural network** to look at a camera image and decide `blocked` or `free`.\n\nThe real JetBot uses *PyTorch* with a **resnet18** on a GPU. The browser has no GPU, so the simulator uses a smaller network: the image is reduced to **16×16 colour pixels** (768 numbers) → **1 hidden layer of 32 neurons** → **2 outputs**: `blocked`, `free`. The training recipe is the same: split train / test, repeat for several *epochs*, keep the best model."], ["md", "### 1. Load the dataset"], ["code", "from jetbot import Dataset, CollisionModel\n\ndataset = Dataset('dataset')\nprint('free:', dataset.count('free'), '· blocked:', dataset.count('blocked'))\ndataset.show(16)    # the 16 newest images"], ["md", "### 2. Create the network\nThe weights start as random numbers, so the model knows nothing yet."], ["code", "model = CollisionModel(hidden=32)"], ["md", "### 3. Train\nEach *epoch* the network sees every training image once (with random brightness changes and horizontal flips, like `ColorJitter`). After each epoch it prints the **test accuracy** (0 to 1). The best model is kept."], ["code", "NUM_EPOCHS = 30\nBEST_MODEL_PATH = 'collision_model.pth'\n\nbest_accuracy = model.train(dataset, epochs=NUM_EPOCHS, test_size=0.2)\nmodel.save(BEST_MODEL_PATH)\nprint('Best accuracy:', best_accuracy)"], ["md", "**Challenge:** low accuracy? Collect more images where the robot gets it wrong, try `hidden=64` or more `NUM_EPOCHS`.\n\nNext: **Lesson 13** lets the robot drive with the saved model."]]}, "l13": {"tag": "AI", "title": "13. AI obstacle avoidance ③: run the model", "desc": "The robot avoids obstacles and stays inside the line using only the camera.", "file": "lesson-13-run-model.ipynb", "cells": [["md", "# Lesson 13 · AI obstacle avoidance ③: Run the model\nUse the trained model to drive. For every frame the network predicts the **probability of being blocked**, `prob_blocked`:\n- `prob_blocked < 0.5`: drive forward.\n- otherwise: turn left.\n\nThe **blocked** bar above the Camera view shows this probability live."], ["md", "### 1. Load the model"], ["code", "from jetbot import Robot, Camera, CollisionModel\nimport time\n\nrobot = Robot()\ncamera = Camera.instance(width=224, height=224)\n\nmodel = CollisionModel()\nmodel.load('collision_model.pth')\nprint('current prob_blocked =', model.predict(camera.value))"], ["md", "### 2. Run\n> The robot will move! Press **Stop** to stop it. The field warns you if the robot leaves the black line."], ["code", "speed = 0.25\n\nfor i in range(1500):\n    prob_blocked = model.predict(camera.value)\n    if prob_blocked < 0.5:\n        robot.forward(speed)\n    else:\n        robot.left(speed)\n    time.sleep(0.05)\n\nrobot.stop()"], ["md", "### Conclusion\nStill bumping or leaving the line? Watch **where it fails**, go back to **Lesson 11** to collect images of exactly those situations, then train again. More varied data makes a better robot.\n\n**Challenge:** raise `speed` to `0.4`. What extra data keeps the robot safe?"]]}};
const lessonIn = (l, lang) => lang === "en" ? Object.assign({}, l, LESSONS_EN[l.id]) : l;
const API_EN = {"robot = Robot()": "Two DCGM-370 motors with encoders, Ø 65 mm wheels, 17 cm apart.", "robot.forward(0.4)": "Drive forward. Optional duration=seconds stops automatically.", "robot.backward(0.4)": "Drive backward.", "robot.left(0.3)": "Spin left in place (left wheel back, right wheel forward).", "robot.right(0.3)": "Spin right in place.", "robot.set_motors(0.4, 0.2)": "Set left and right speeds separately (-1.0 … 1.0).", "robot.left_motor.value = 0.3": "Read / write each motor's speed.", "robot.stop()": "Stop both motors.", "robot.bumped()": "True if the robot just hit something.", "enc = Encoder()": "Optical encoder, 1320 ticks per wheel turn, Ø 65 mm wheel.", "enc.read()": "(left ticks, right ticks).", "enc.distance()": "(left metres, right metres) since the last reset.", "enc.speed()": "Wheel speed (m/s).", "enc.reset()": "Reset the counters to 0.", "imu = IMU()": "9-axis attitude sensor on the driver board.", "imu.yaw()": "Angle turned (degrees), left is positive, does not wrap back to 0.", "imu.heading()": "Heading 0 … 360 degrees.", "imu.gyro()": "Turn rate around the z axis (degrees/s).", "imu.accel()": "Acceleration (ax, ay, az) m/s².", "imu.reset()": "Set yaw to 0.", "lidar = Lidar()": "360° scanning Lidar, 12 m range.", "lidar.scan()": "List of 360 distances (m), index = angle, 0 is the front.", "lidar.distance(90)": "Distance at one angle (90 = left, -90 = right).", "lidar.min_distance(-30, 30)": "Smallest distance within an arc of angles.", "camera = Camera()": "CSI camera at the front of the robot.", "camera.line_position()": "Black line offset: -1 left … +1 right, None if the line is lost.", "camera.sees_line()": "True if the line is visible.", "camera.color()": "Colour of the square under the camera: \"red\", \"green\", \"blue\", \"yellow\" or None.", "oled = OLED()": "4-line OLED screen on the robot.", "oled.text(\"Xin chao\", 0)": "Write text on line 0 … 3.", "oled.clear()": "Clear the screen.", "camera.value": "Take a 224×224 snapshot from the robot camera.", "camera.value.show()": "Show the camera image in the output.", "dataset = Dataset('dataset')": "Image dataset with two folders, free and blocked, kept in the browser.", "dataset.widget()": "Show the live camera and the add free / add blocked buttons.", "dataset.add_free()": "Take a snapshot and label it free.", "dataset.add_blocked()": "Take a snapshot and label it blocked.", "dataset.count('free')": "Number of images with a label (empty: all).", "dataset.show(12)": "Show the newest images.", "dataset.clear()": "Delete every image.", "model = CollisionModel()": "Neural network 768 → 32 → 2 that classifies blocked / free.", "model.train(dataset, epochs=30)": "Train, print accuracy per epoch, return the best accuracy.", "model.save('collision_model.pth')": "Save the model in the browser.", "model.load('collision_model.pth')": "Load a saved model.", "model.predict(camera.value)": "Probability of being blocked, 0 to 1.", "time.sleep(0.5)": "Wait in simulated time (seconds).", "time.time()": "Simulated time (seconds), reset by Restart or Back to start."};
const MAP_EN = {"open": "Open field · 10 cm grid", "line": "Line track", "obst": "Obstacles · Lidar", "maze": "Maze · wall following", "arena": "AI obstacle avoidance · camera"};
const mapName = id => LANG === "en" ? MAP_EN[id] : MAPS[id].name;
const ANCHOR_EN = {"Camera góc rộng": "Wide-angle camera", "trên mạch Waveshare": "on Waveshare board", "Động cơ + encoder": "Motor + encoder", "trái": "left", "phải": "right", "Pin 3×18650": "3×18650 battery", "Bánh tự do": "Caster", "trước": "front", "sau": "rear"};
const tA = s => LANG === "en" ? (ANCHOR_EN[s] || s) : s;
const API = [
 ["Robot", "from jetbot import Robot", [
  ["robot = Robot()", "Hai động cơ DCGM-370 có encoder, bánh Ø 65 mm, cách nhau 17 cm."],
  ["robot.forward(0.4)", "Tiến. Tham số tuỳ chọn duration=giây sẽ tự dừng."],
  ["robot.backward(0.4)", "Lùi."],
  ["robot.left(0.3)", "Quay trái tại chỗ (bánh trái lùi, bánh phải tiến)."],
  ["robot.right(0.3)", "Quay phải tại chỗ."],
  ["robot.set_motors(0.4, 0.2)", "Đặt tốc độ trái, phải riêng (-1.0 … 1.0)."],
  ["robot.left_motor.value = 0.3", "Đọc / ghi tốc độ từng động cơ."],
  ["robot.stop()", "Dừng cả hai động cơ."],
  ["robot.bumped()", "True nếu robot vừa va chạm."]]],
 ["Encoder", "from jetbot import Encoder", [
  ["enc = Encoder()", "Encoder quang 1320 xung/vòng, bánh Ø 65 mm."],
  ["enc.read()", "(xung trái, xung phải)."],
  ["enc.distance()", "(mét trái, mét phải) tính từ lần reset."],
  ["enc.speed()", "Tốc độ bánh (m/s)."],
  ["enc.reset()", "Đưa bộ đếm về 0."]]],
 ["IMU", "from jetbot import IMU", [
  ["imu = IMU()", "Cảm biến tư thế 9 trục trên mạch điều khiển."],
  ["imu.yaw()", "Góc đã quay (độ), quay trái là dương, không bị cuộn về 0."],
  ["imu.heading()", "Hướng 0 … 360 độ."],
  ["imu.gyro()", "Tốc độ quay quanh trục z (độ/s)."],
  ["imu.accel()", "Gia tốc (ax, ay, az) m/s²."],
  ["imu.reset()", "Đặt yaw về 0."]]],
 ["Lidar", "from jetbot import Lidar", [
  ["lidar = Lidar()", "Lidar quét 360°, tầm xa 12 m."],
  ["lidar.scan()", "Danh sách 360 khoảng cách (m), chỉ số = góc, 0 là phía trước."],
  ["lidar.distance(90)", "Khoảng cách tại một góc (90 = trái, -90 = phải)."],
  ["lidar.min_distance(-30, 30)", "Khoảng cách nhỏ nhất trong một cung góc."]]],
 ["Camera", "from jetbot import Camera", [
  ["camera = Camera()", "Camera CSI phía trước robot."],
  ["camera.line_position()", "Độ lệch vạch đen: -1 trái … +1 phải, None nếu mất vạch."],
  ["camera.sees_line()", "True nếu thấy vạch."],
  ["camera.color()", "Màu ô dưới camera: \"red\", \"green\", \"blue\", \"yellow\" hoặc None."]]],
 ["OLED", "from jetbot import OLED", [
  ["oled = OLED()", "Màn hình OLED 4 dòng trên robot."],
  ["oled.text(\"Xin chao\", 0)", "Ghi chữ lên dòng 0 … 3."],
  ["oled.clear()", "Xoá màn hình."]]],
 ["AI", "from jetbot import Dataset, CollisionModel", [["camera.value", "Chụp ảnh 224×224 từ camera robot."], ["camera.value.show()", "Hiện ảnh camera trong ô kết quả."], ["dataset = Dataset('dataset')", "Bộ dữ liệu ảnh gồm 2 thư mục free và blocked, lưu trong trình duyệt."], ["dataset.widget()", "Hiện camera trực tiếp và nút add free / add blocked."], ["dataset.add_free()", "Chụp ảnh hiện tại, gán nhãn free."], ["dataset.add_blocked()", "Chụp ảnh hiện tại, gán nhãn blocked."], ["dataset.count('free')", "Số ảnh của một nhãn (bỏ trống: tất cả)."], ["dataset.show(12)", "Xem các ảnh mới nhất."], ["dataset.clear()", "Xoá toàn bộ ảnh."], ["model = CollisionModel()", "Mạng nơ-ron 768 → 32 → 2 phân loại blocked / free."], ["model.train(dataset, epochs=30)", "Huấn luyện, in độ chính xác mỗi epoch, trả về độ chính xác tốt nhất."], ["model.save('collision_model.pth')", "Lưu mô hình vào trình duyệt."], ["model.load('collision_model.pth')", "Nạp mô hình đã lưu."], ["model.predict(camera.value)", "Xác suất bị chặn, từ 0 đến 1."]]],
 ["time", "import time", [
  ["time.sleep(0.5)", "Chờ theo thời gian mô phỏng (giây)."],
  ["time.time()", "Thời gian mô phỏng (giây), về 0 khi Khởi động lại hoặc Về xuất phát."]]]
];

/* =====================================================================
   5. NOTEBOOK
   ===================================================================== */
let CELLS = [], ACTIVE = null, uid = 0;
const cellsEl = $("#cells");
const KW = "and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None";
const BI = "print|range|len|abs|min|max|round|int|float|str|list|dict|tuple|set|enumerate|sum|sorted|input|type|isinstance|zip|map";
const TOK = new RegExp(`(#.*$)|([rRbBfF]?(?:"""[\\s\\S]*?(?:"""|$)|'''[\\s\\S]*?(?:'''|$)|"(?:\\\\.|[^"\\\\\\n])*"?|'(?:\\\\.|[^'\\\\\\n])*'?))|\\b(\\d+\\.?\\d*(?:e[+-]?\\d+)?)\\b|\\b(${KW})\\b|\\b(self)\\b|\\b(${BI})\\b(?=\\s*\\()|\\b([A-Za-z_]\\w*)(?=\\s*\\()`, "gm");
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function highlight(src){
  let out = "", last = 0, m; TOK.lastIndex = 0;
  while ((m = TOK.exec(src))){
    if (m[0] === ""){ TOK.lastIndex++; continue; }
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? "com" : m[2] ? "str" : m[3] ? "num" : m[4] ? "kw" : m[5] ? "self" : m[6] ? "bi" : "fn";
    out += `<span class="t-${cls}">${esc(m[0])}</span>`; last = m.index + m[0].length;
  }
  return out + esc(src.slice(last)) + "\n";
}
// Markdown kiểu Jupyter / Colab: đoạn văn gộp dòng, `code` và ``code``, **đậm**, *nghiêng*, _nghiêng_, [liên kết](https://…),
// tiêu đề #…######, danh sách - / 1., trích dẫn > nhiều dòng, khối ``` có tô màu Python.
// HTML trong ghi chú (như Jupyter): chỉ giữ thẻ / thuộc tính / CSS an toàn, không script, không url(), không sự kiện on*.
const HTML_TAGS = new Set("div span p br hr b strong i em u s sub sup small mark code pre ul ol li table thead tbody tr th td center details summary h1 h2 h3 h4 h5 h6 blockquote img button".split(" "));
const HTML_VOID = new Set(["br", "hr", "img"]);
const CSS_OK = /^(color|background|background-color|border(-(left|right|top|bottom))?(-(color|width|style|radius))?|border-radius|padding(-(left|right|top|bottom))?|margin(-(left|right|top|bottom))?|text-align|font-(weight|style|size)|text-decoration|width|max-width|min-width|height|display|gap|align-items|justify-content|line-height|vertical-align|list-style(-type)?)$/;
let MD_ATT = null;
const attr = v => esc(String(v)).replace(/"/g, "&quot;");
function imgSrc(src){
  const m = /^attachment:(.+)$/.exec(src);
  if (m){ const d = MD_ATT && MD_ATT[decodeURIComponent(m[1])]; if (!d) return null; const mime = Object.keys(d)[0]; return `data:${mime};base64,${d[mime]}`; }
  return /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(src) ? src : null;
}
function cleanTag(tag){
  const m = /^<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?\s*>$/.exec(tag); if (!m) return null;
  const name = m[2].toLowerCase(); if (!HTML_TAGS.has(name)) return null;
  if (m[1]) return HTML_VOID.has(name) ? "" : `</${name}>`;
  let out = "<" + name; const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g; let a;
  while ((a = re.exec(m[3]))){
    const k = a[1].toLowerCase(), v = a[3] ?? a[4] ?? a[5] ?? "";
    if (k === "style"){
      const css = v.split(";").map(d => d.split(":")).filter(([p, val]) => p && val !== undefined && CSS_OK.test(p.trim().toLowerCase()) && !/url\s*\(|expression|javascript:|@import|[<>\\]/i.test(val)).map(([p, ...val]) => p.trim().toLowerCase() + ":" + val.join(":").trim()).join(";");
      if (css) out += ` style="${attr(css)}"`;
    } else if (name === "button"){
      // Nút nghe phát âm: chỉ giữ data-say (chữ cần đọc), data-rate (0.3–1.5), data-lang (vd. en-US, en-GB)
      if (k === "data-say") out += ` data-say="${attr(v.slice(0, 3000))}"`;
      else if (k === "data-rate" && /^\d(\.\d+)?$/.test(v)) out += ` data-rate="${v}"`;
      else if (k === "data-lang" && /^[a-z]{2}(-[A-Z]{2})?$/.test(v)) out += ` data-lang="${v}"`;
    } else if (["align", "colspan", "rowspan", "width", "height", "alt", "title"].includes(k)) out += ` ${k}="${attr(v)}"`;
    else if (k === "src" && name === "img"){ const s = imgSrc(v); if (s) out += ` src="${attr(s)}"`; else return null; }
  }
  if (name === "img" && !/ src="/.test(out)) return null;
  if (name === "button") out += ' type="button" class="say"';
  return out + ">";
}
function mdInline(s){
  const keep = [], hold = h => "\u0000" + (keep.push(h) - 1) + "\u0000";
  s = s.replace(/``(.+?)``|`([^`]+)`/g, (_, a, b) => hold("<code>" + esc(a ?? b) + "</code>"));
  s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g, (_, alt, src) => {
    const u = imgSrc(src); if (u) return hold(`<img src="${attr(u)}" alt="${attr(alt)}">`);
    return /^https?:\/\//.test(src) ? hold(`<a href="${attr(src)}" target="_blank" rel="noopener noreferrer">${esc(alt || src)}</a>`) : hold(esc(alt));
  });
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, url) => hold(`<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">${esc(txt)}</a>`));
  s = s.replace(/&(#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, m => hold(m));
  s = s.replace(/<\/?[a-zA-Z][^<>]*>/g, m => { const c = cleanTag(m); return c === null ? m : hold(c); });
  s = esc(s)
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<b><em>$1</em></b>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/__([^_]+)__/g, "<b>$1</b>")
    .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>").replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
}
function mdRender(src, att){
  const prevAtt = MD_ATT; MD_ATT = att || null;
  try { return mdBlocks(src); } finally { MD_ATT = prevAtt; }
}
function mdBlocks(src){
  const lines = src.replace(/\r/g, "").split("\n"); let html = "", i = 0;
  const HTML_LINE = /^\s*(<\/?[a-zA-Z][^<>]*>\s*)+$/;
  const SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
  const cellsOf = l => { let s = l.trim(); if (s.startsWith("|")) s = s.slice(1); if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1); return s.split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, "|")); };
  const isTable = j => j + 1 < lines.length && lines[j].includes("|") && SEP.test(lines[j + 1]) && cellsOf(lines[j]).length === cellsOf(lines[j + 1]).length;
  const isBlock = l => /^\s*(#{1,6} |[-*+] |\d+[.)] |>|```)/.test(l) || HTML_LINE.test(l);
  const startsBlock = j => isBlock(lines[j]) || isTable(j);
  while (i < lines.length){
    const l = lines[i];
    if (!l.trim()){ i++; continue; }
    if (HTML_LINE.test(l)){ html += l.match(/<\/?[a-zA-Z][^<>]*>/g).map(tg => cleanTag(tg) ?? esc(tg)).join(""); i++; continue; }
    if (/^\s*```/.test(l)){
      const body = []; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++; html += `<pre class="mdpre"><code>${highlight(body.join("\n")).replace(/\n$/, "")}</code></pre>`; continue;
    }
    const h = l.match(/^\s*(#{1,6}) (.*)/);
    if (h){ html += `<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`; i++; continue; }
    if (/^\s*>/.test(l)){
      const q = []; while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*> ?/, ""));
      html += "<blockquote>" + mdBlocks(q.join("\n")) + "</blockquote>"; continue;
    }
    if (isTable(i)){
      const head = cellsOf(lines[i]), al = cellsOf(lines[i + 1]).map(c => /^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : ""); i += 2;
      const cell = (c, k, tag) => `<${tag}${al[k] ? ` style="text-align:${al[k]}"` : ""}>${mdInline(c)}</${tag}>`;
      let body = "";
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")){ const r = cellsOf(lines[i++]); body += "<tr>" + head.map((_, k) => cell(r[k] ?? "", k, "td")).join("") + "</tr>"; }
      html += `<div class="mdtable"><table><thead><tr>${head.map((c, k) => cell(c, k, "th")).join("")}</tr></thead><tbody>${body}</tbody></table></div>`; continue;
    }
    const li = l.match(/^\s*([-*+]|\d+[.)]) /);
    if (li){
      const ol = /\d/.test(li[1]), re = ol ? /^\s*\d+[.)] / : /^\s*[-*+] /; let items = "";
      while (i < lines.length && re.test(lines[i])){
        let it = lines[i++].replace(re, "");
        while (i < lines.length && lines[i].trim() && !startsBlock(i)) it += " " + lines[i++].trim();
        items += "<li>" + mdInline(it) + "</li>";
      }
      html += ol ? `<ol>${items}</ol>` : `<ul>${items}</ul>`; continue;
    }
    const p = [l.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(i)) p.push(lines[i++].trim());
    html += "<p>" + p.map(mdInline).join(" ") + "</p>";
  }
  return html || '<p class="md-empty">' + esc(t("mdEmpty")) + '</p>';
}
const ICON = {
  run:'<svg width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 1.5l8 4.5-8 4.5z" fill="currentColor"/></svg>',
  stop:'<svg width="10" height="10" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="currentColor"/></svg>',
  up:'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  down:'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  type:'<svg width="13" height="12" viewBox="0 0 13 12"><text x="0" y="10" font-size="10" font-family="monospace" fill="currentColor">M↓</text></svg>',
  del:'<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 3.5h7M5 3.5V2h2v1.5M3.5 3.5l.5 7h4l.5-7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'
};
// Nút nghe trong ghi chú: <button data-say="obstacle" data-rate="0.5" data-lang="en-GB">Listen</button>
// Dùng giọng đọc có sẵn của trình duyệt (Web Speech API), không tải gì từ mạng. data-say="" = nút dừng đọc.
function sayButton(b){
  const S = window.speechSynthesis;
  if (!S || typeof SpeechSynthesisUtterance === "undefined"){ toast(t("noVoice")); return; }
  S.cancel(); document.querySelectorAll(".md button.say.speaking").forEach(x => x.classList.remove("speaking"));
  const text = b.dataset.say || ""; if (!text.trim()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = b.dataset.lang || "en-US";
  const r = parseFloat(b.dataset.rate); u.rate = r >= 0.3 && r <= 1.5 ? r : 0.9;
  const voices = S.getVoices(), norm = v => v.lang.replace("_", "-");
  const v = voices.find(v => norm(v) === u.lang) || voices.find(v => norm(v).startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v; else if (voices.length){ toast(t("noVoice")); return; }
  b.classList.add("speaking"); u.onend = u.onerror = () => b.classList.remove("speaking");
  S.speak(u);
}
function makeCell(type, src, att){
  const c = { id: ++uid, type, src: src || "", att: att || null, count: null, state: "", errLine: 0 };
  const el = document.createElement("div");
  el.className = "cell" + (type === "md" ? " mdc" : "");
  el.innerHTML = `<div class="gut"><span class="pr"></span><button class="grip" title="${t("grip")}" aria-label="${t("grip")}"><svg width="10" height="16" viewBox="0 0 10 16"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.4"/><circle cx="7.5" cy="3" r="1.4"/><circle cx="2.5" cy="8" r="1.4"/><circle cx="7.5" cy="8" r="1.4"/><circle cx="2.5" cy="13" r="1.4"/><circle cx="7.5" cy="13" r="1.4"/></g></svg></button></div><div class="cbody"><div class="ed"><div class="errbar" hidden></div><pre class="hl" aria-hidden="true"></pre><textarea id="cell-${c.id}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${t(type === "md" ? "cellMd" : "cellCode")}"></textarea></div>${type === "md" ? '<div class="md"></div>' : ""}<div class="out" aria-live="polite"></div></div>
  <div class="ctools"><button class="r" data-a="run" title="${t("cRun")}">${ICON.run}</button><button data-a="up" title="${t("cUp")}">${ICON.up}</button><button data-a="down" title="${t("cDown")}">${ICON.down}</button><button data-a="type" title="${t("cType")}">${ICON.type}</button><button data-a="del" title="${t("cDel")}">${ICON.del}</button></div>`;
  c.el = el; c.ta = el.querySelector("textarea"); c.hl = el.querySelector("pre"); c.out = el.querySelector(".out");
 c.gut = el.querySelector(".gut .pr"); el._cell = c; bindGrip(c, el.querySelector(".grip"));
  c.md = el.querySelector(".md"); c.errbar = el.querySelector(".errbar");
  c.ta.value = c.src;
  c.ta.addEventListener("input", () => { c.src = c.ta.value; paint(c); if (c.errLine){ c.errLine = 0; c.errbar.hidden = true; } save(); });
  c.ta.addEventListener("keydown", e => onKey(e, c));
  c.ta.addEventListener("focus", () => setActive(c));
  el.addEventListener("mousedown", () => setActive(c));
  if (c.md){
    c.md.addEventListener("dblclick", e => { if (e.target.closest("button.say")) return; el.classList.add("editing"); c.ta.focus(); });
    c.md.addEventListener("click", e => { const b = e.target.closest("button.say"); if (b){ e.stopPropagation(); sayButton(b); } });
    c.ta.addEventListener("blur", () => { if (c.src.trim()) el.classList.remove("editing"); gutter(c); });
    c.ta.addEventListener("focus", () => gutter(c));
    // Bấm cây bút ✎ để sửa; bấm lần nữa để xong
    c.gut.setAttribute("role", "button"); c.gut.tabIndex = 0;
    const toggleEdit = () => {
      if (el.classList.contains("editing")){ el.classList.remove("editing"); c.ta.blur(); }
      else { setActive(c); el.classList.add("editing"); c.ta.focus(); c.ta.setSelectionRange(c.ta.value.length, c.ta.value.length); }
      gutter(c);
    };
    c.gut.addEventListener("mousedown", e => e.preventDefault());
    c.gut.addEventListener("click", toggleEdit);
    c.gut.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleEdit(); } });
  }
  el.querySelector(".ctools").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; const a = b.dataset.a, i = CELLS.indexOf(c);
    if (a === "run"){ if (c.state === "running") stopAll(); else runCells([c]); }
    if (a === "up" && i > 0){ CELLS.splice(i,1); CELLS.splice(i-1,0,c); cellsEl.insertBefore(el, CELLS[i].el); save(); }
    if (a === "down" && i < CELLS.length-1){ CELLS.splice(i,1); CELLS.splice(i+1,0,c); cellsEl.insertBefore(el, CELLS[i+1].el.nextSibling); save(); }
    if (a === "type"){ const n = makeCell(c.type === "md" ? "code" : "md", c.src, c.att); replaceCell(c, n); }
    if (a === "del"){ removeCell(c); }
  });
  paint(c); gutter(c);
  return c;
}
function bindGrip(c, grip){
  grip.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault(); setActive(c);
    const line = document.createElement("div"); line.className = "dropline";
    const scroller = cellsEl.scrollHeight > cellsEl.clientHeight + 2 ? cellsEl : null;
    let lastY = e.clientY, raf = 0, moved = false;
    grip.setPointerCapture(e.pointerId);
    c.el.classList.add("dragging"); document.body.classList.add("reordering");
    const place = () => {
      const others = CELLS.filter(x => x !== c);
      const tgt = others.find(x => { const r = x.el.getBoundingClientRect(); return lastY < r.top + r.height/2; });
      cellsEl.insertBefore(line, tgt ? tgt.el : addRow);
    };
    const tick = () => {
      const box = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: innerHeight };
      const edge = 48; let dy = 0;
      if (lastY < box.top + edge) dy = -Math.ceil((box.top + edge - lastY)/4);
      else if (lastY > box.bottom - edge) dy = Math.ceil((lastY - box.bottom + edge)/4);
      if (dy){ scroller ? (scroller.scrollTop += dy) : scrollBy(0, dy); place(); }
      raf = requestAnimationFrame(tick);
    };
    const mv = ev => { lastY = ev.clientY; if (!moved && Math.abs(ev.clientY - e.clientY) > 3){ moved = true; raf = requestAnimationFrame(tick); } if (moved) place(); };
    const up = () => {
      cancelAnimationFrame(raf);
      grip.removeEventListener("pointermove", mv); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up);
      c.el.classList.remove("dragging"); document.body.classList.remove("reordering");
      if (line.parentNode){ cellsEl.insertBefore(c.el, line); line.remove(); }
      CELLS = [...cellsEl.querySelectorAll(":scope > .cell")].map(x => x._cell);
      save();
    };
    grip.addEventListener("pointermove", mv); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
  });
  grip.addEventListener("keydown", e => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault(); c.el.querySelector(`[data-a="${e.key === "ArrowUp" ? "up" : "down"}"]`).click(); grip.focus();
  });
}
function paint(c){
  c.hl.innerHTML = c.type === "md" ? esc(c.src) + "\n" : highlight(c.src);
  if (c.md) c.md.innerHTML = mdRender(c.src, c.att);
}
function gutter(c){
  if (c.type === "md"){ c.gut.textContent = "✎"; const ed = c.el.classList.contains("editing"); c.gut.title = t(ed ? "doneNote" : "editNote"); c.gut.setAttribute("aria-label", c.gut.title); c.gut.setAttribute("aria-pressed", ed); return; }
  c.gut.textContent = c.state === "running" ? "[*]:" : c.state === "queued" ? "[-]:" : `[${c.count ?? " "}]:`;
  c.el.classList.toggle("running", c.state === "running");
  const b = c.el.querySelector('[data-a="run"]'); b.innerHTML = c.state === "running" ? ICON.stop : ICON.run; b.title = t(c.state === "running" ? "cStop" : "cRun");
}
function setActive(c){ if (ACTIVE === c) return; if (ACTIVE) ACTIVE.el.classList.remove("active"); ACTIVE = c; if (c) c.el.classList.add("active"); }
function insertAfter(ref, c){
  const i = ref ? CELLS.indexOf(ref) : CELLS.length - 1;
  CELLS.splice(i + 1, 0, c);
  const next = CELLS[i + 2];
  cellsEl.insertBefore(c.el, next ? next.el : addRow);
  setActive(c); save(); return c;
}
function replaceCell(o, n){ const i = CELLS.indexOf(o); CELLS[i] = n; cellsEl.replaceChild(n.el, o.el); if (ACTIVE === o){ ACTIVE = null; setActive(n); } if (n.type === "md") n.el.classList.add("editing"); save(); }
function removeCell(c){
  if (c.state === "running") stopAll();
  const i = CELLS.indexOf(c); CELLS.splice(i, 1); c.el.remove();
  if (!CELLS.length) insertAfter(null, makeCell("code", ""));
  else setActive(CELLS[Math.min(i, CELLS.length-1)]);
  save();
}
function insertText(ta, text){
  ta.focus();
  if (!document.execCommand("insertText", false, text)){ ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); }
}
function onKey(e, c){
  const ta = c.ta;
  if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)){
    e.preventDefault();
    if (c.type === "md"){ c.el.classList.remove("editing"); }
    if (c.type === "code") runCells([c]);
    if (e.shiftKey || e.altKey){
      const i = CELLS.indexOf(c);
      let n = CELLS[i+1];
      if (!n || e.altKey) n = insertAfter(c, makeCell("code", ""));
      setActive(n);
      if (n.type === "code") n.ta.focus(); else { ta.blur(); n.el.scrollIntoView({block:"nearest"}); }
    }
    return;
  }
  if (e.key === "Escape"){ ta.blur(); if (c.type === "md") c.el.classList.remove("editing"); return; }
  const s = ta.selectionStart, v = ta.value, ls = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(ls, s);
  if (e.key === "Tab"){
    e.preventDefault();
    if (e.shiftKey){ const m = v.slice(ls).match(/^ {1,4}/); if (m){ ta.setSelectionRange(ls, ls + m[0].length); insertText(ta, ""); } }
    else insertText(ta, "    ".slice((line.length) % 4));
    return;
  }
  if (e.key === "Enter" && c.type === "code"){
    e.preventDefault();
    let ind = line.match(/^ */)[0];
    if (/:\s*(#.*)?$/.test(line)) ind += "    ";
    if (/^\s*(return|break|continue|pass)\b/.test(line)) ind = ind.slice(4);
    insertText(ta, "\n" + ind); return;
  }
  if (e.key === "Backspace" && s === ta.selectionEnd && line.length && /^ +$/.test(line)){
    const n = line.length % 4 || 4; e.preventDefault(); ta.setSelectionRange(s - n, s); insertText(ta, "");
  }
}
const addRow = document.createElement("div");
addRow.className = "addrow";
function renderAddRow(){ addRow.innerHTML = `<button data-t="code">${esc(t("addRowCode"))}</button><button data-t="md">${esc(t("addRowMd"))}</button>`; }
renderAddRow();
addRow.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const n = insertAfter(CELLS[CELLS.length-1], makeCell(b.dataset.t, "")); if (b.dataset.t === "md") n.el.classList.add("editing"); n.ta.focus(); });

function loadCells(list, title){
  if (K.running) stopAll();
  cellsEl.innerHTML = ""; CELLS = []; ACTIVE = null;
  list.forEach(([t, s, a]) => { const c = makeCell(t, s, a); CELLS.push(c); cellsEl.appendChild(c.el); });
  cellsEl.appendChild(addRow);
  if (title) $("#nbTitle").value = title;
  setActive(CELLS.find(c => c.type === "code") || CELLS[0]);
  markStep(CELLS.find(c => c.type === "code"));
  cellsEl.scrollTop = 0; save();
}
let saveT;
let saveNoImgWarned = false;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const d = { title: $("#nbTitle").value, map: MAPID, cells: CELLS.map(c => c.att ? [c.type, c.src, c.att] : [c.type, c.src]) };
    try { localStorage.setItem("jetbotlab.nb.v1", JSON.stringify(d)); }
    catch (e) {
      // ảnh nhúng vượt dung lượng bộ nhớ trình duyệt: vẫn tự lưu chữ, ảnh thì nhắc dùng Lưu tệp
      d.cells = d.cells.map(x => x.slice(0, 2)); store.set("jetbotlab.nb.v1", d);
      if (!saveNoImgWarned){ saveNoImgWarned = true; toast(t("autosaveNoImg")); }
    }
  }, 300);
}
$("#nbTitle").addEventListener("input", save);

/* ---------- outputs ---------- */
function outText(c, s){
  let pre = c.out.lastElementChild;
  if (!pre || pre.tagName !== "PRE"){ pre = document.createElement("pre"); c.out.appendChild(pre); }
  pre.textContent += s;
  if (pre.textContent.length > 20000) pre.textContent = t("trimmed") + "\n" + pre.textContent.slice(-15000);
}
const HINTS_EN = {"NameError": "This variable or function name is not defined. Check the spelling (Python is case-sensitive) or run the setup cell above first.", "SyntaxError": "Syntax error. Check the colon at the end of if / for / while / def lines, brackets and quotes.", "IndentationError": "Wrong indentation. Lines in the same block must be indented equally (usually 4 spaces, press Tab).", "TypeError": "Wrong data type or wrong number of arguments. Check the call in the API tab.", "AttributeError": "This object has no such attribute or method. Open the API tab on the left to see the correct name.", "ImportError": "Library not found. The simulator supports: jetbot, time, math, random.", "ModuleNotFoundError": "Library not found. The simulator supports: jetbot, time, math, random.", "ZeroDivisionError": "Division by zero.", "IndexError": "Index out of range. lidar.scan() has indexes 0 to 359.", "ValueError": "Invalid value, for example converting text to a number.", "TimeoutError": "The program ran too long."};
const HINTS = {
  NameError:"Tên biến hoặc hàm chưa được định nghĩa. Kiểm tra chính tả (Python phân biệt chữ hoa, chữ thường) hoặc chạy ô khởi tạo phía trên trước.",
  SyntaxError:"Sai cú pháp. Kiểm tra dấu hai chấm ở cuối dòng if / for / while / def, các cặp ngoặc và dấu nháy.",
  IndentationError:"Thụt lề chưa đúng. Các lệnh trong cùng một khối phải thụt vào bằng nhau (thường là 4 dấu cách, nhấn Tab).",
  TypeError:"Sai kiểu dữ liệu hoặc sai số tham số khi gọi hàm. Xem lại cách gọi trong tab API.",
  AttributeError:"Đối tượng không có thuộc tính hay phương thức này. Mở tab API ở thanh bên trái để xem tên đúng.",
  ImportError:"Không tìm thấy thư viện. Mô phỏng hỗ trợ: jetbot, time, math, random.",
  ModuleNotFoundError:"Không tìm thấy thư viện. Mô phỏng hỗ trợ: jetbot, time, math, random.",
  ZeroDivisionError:"Phép chia cho 0.",
  IndexError:"Chỉ số vượt quá độ dài danh sách. Danh sách lidar.scan() có chỉ số từ 0 đến 359.",
  ValueError:"Giá trị không hợp lệ, ví dụ đổi chữ sang số.",
  TimeoutError:"Chương trình chạy quá lâu."
};
function outError(c, e){
  const box = document.createElement("div"); box.className = "err";
  if (e && e.__stop){ box.innerHTML = "<b>KeyboardInterrupt</b>: " + t("interrupted"); c.out.appendChild(box); return; }
  let name = "Error", msg = String(e), line = 0;
  if (e && e.tp$name){
    name = e.tp$name;
    try{ msg = Sk.ffi.remapToJs(e.args).join(", "); }catch(x){ msg = e.toString(); }
    const tb = (e.traceback || []).filter(t => t.filename && t.filename.indexOf("<stdin>") === 0);
    if (tb.length) line = tb[tb.length - 1].lineno;
  }
  msg = String(msg).replace(/ on line \d+$/, "");
  const bm = /^No module named (\w+)/.exec(msg);
  if (bm && Sk.builtinFiles && Object.keys(Sk.builtinFiles.files).some(k => k.indexOf("src/lib/" + bm[1] + ".") === 0 || k.indexOf("src/lib/" + bm[1] + "/") === 0)) msg += " · " + t("blockedMod");
  box.innerHTML = `<b>${esc(name)}</b>: ${esc(msg)}${line ? ` <span class="meta">· ${t("line")} ${line}</span>` : ""}${(LANG === "en" ? HINTS_EN : HINTS)[name] ? `<div class="ehint">${(LANG === "en" ? HINTS_EN : HINTS)[name]}</div>` : ""}`;
  c.out.appendChild(box);
  if (line){ c.errLine = line; c.errbar.hidden = false; c.errbar.style.top = (9 + (line - 1)*20) + "px"; }
}

/* =====================================================================
   6. KERNEL (Skulpt – Python 3 trong trình duyệt)
   ===================================================================== */
const K = { ready:false, running:false, queue:[], stop:false, count:0, cur:null, injected:new Set(), base:null };
let KSTAT = "kLoad";
function kstat(s, key){ KSTAT = key; $("#kpill").dataset.s = s; $("#kstat").textContent = t(key); }
function initKernel(){
  if (!window.Sk){ kstat("load", "kFail"); return; }
  Sk.configure({
    output: s => { if (K.cur) outText(K.cur, s); },
    read: pyRead,
    fileopen: () => { throw new Sk.builtin.IOError(t("noFiles")); },
    filewrite: () => { throw new Sk.builtin.IOError(t("noFiles")); },
    inputfun: p => new Promise(res => {
      const c = K.cur, row = document.createElement("div"); row.className = "ask";
      row.innerHTML = `<span>${esc(p || "")}</span><input id="ask-${Date.now()}" aria-label="${t("inputAria")}">`;
      c.out.appendChild(row); const inp = row.querySelector("input"); inp.focus();
      inp.addEventListener("keydown", e => { if (e.key === "Enter"){ const v = inp.value; row.remove(); outText(c, (p||"") + v + "\n"); res(v); } });
    }),
    inputfunTakesPrompt: true, __future__: Sk.python3, yieldLimit: 25, killableWhile: true, killableFor: true
  });
  // Gỡ các lối thoát khỏi sandbox: jseval chạy JavaScript tuỳ ý, open/file đọc phần tử trang.
  const deny = msgKey => new Sk.builtin.func(function(){ throw new (Sk.builtin.IOError || Sk.builtin.Exception)(t(msgKey)); });
  for (const k of ["jseval", "execfile"]) { try { delete Sk.builtins[k]; } catch (e) { Sk.builtins[k] = deny("noFiles"); } }
  Sk.builtins.open = deny("noFiles"); Sk.builtins.file = deny("noFiles");
  K.ready = true; kstat("idle", "kIdle");
}
function setBusy(b){
  K.running = b; $("#bStop").disabled = !b;
  kstat(b ? "busy" : "idle", b ? "kBusy" : "kIdle");
}
function runCells(list){
  if (!K.ready){ toast(t("pyLoading")); return; }
  list.filter(c => c.type === "code").forEach(c => { if (!K.queue.includes(c) && K.cur !== c){ c.state = "queued"; gutter(c); K.queue.push(c); } });
  if (!K.running) pump();
}
async function pump(){
  if (!K.queue.length){ setBusy(false); K.cur = null; return; }
  setBusy(true);
  const c = K.queue.shift(); K.cur = c; K.stop = false;
  c.state = "running"; c.out.innerHTML = ""; c.errLine = 0; c.errbar.hidden = true; gutter(c);
  let ok = true;
  try {
    const mod = await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, c.src, true),
      { "*": () => { if (K.stop) throw { __stop: true }; } });
    keepGlobals(mod);
  } catch (e) {
    ok = false;
    try { keepGlobals(Sk.sysmodules.mp$subscript(new Sk.builtin.str("__main__"))); } catch (x) {}
    SIM.setMotors(0, 0);
    outError(c, e);
  }
  c.count = ++K.count; c.state = ""; gutter(c); K.cur = null;
  if (!ok){ K.queue.forEach(q => { q.state = ""; gutter(q); }); K.queue = []; }
  pump();
}
function keepGlobals(mod){
  if (!mod || !mod.$d) return;
  for (const k in mod.$d){ if (k.startsWith("__")) continue; if (!K.base) K.base = new Set(Object.keys(Sk.builtins)); if (K.base.has(k) && !K.injected.has(k)) continue; Sk.builtins[k] = mod.$d[k]; K.injected.add(k); }
}
function stopAll(){
  K.stop = true; SIM.setMotors(0, 0); SIM.wakeAll();
  K.queue.forEach(q => { q.state = ""; gutter(q); }); K.queue = [];
}
function restartKernel(){
  stopAll();
  const done = () => {
    K.injected.forEach(k => { delete Sk.builtins[k]; }); K.injected.clear();
    for (const k of ["__main__", "jetbot", "_sim", "time"]){ try{ Sk.sysmodules.mp$del_subscript(new Sk.builtin.str(k)); }catch(e){} }
    K.count = 0; CELLS.forEach(c => { c.count = null; gutter(c); });
    SIM.resetClock(); markStep(CELLS.find(c => c.type === "code"));
    toast(t("restarted"));
  };
  if (K.running){ const w = setInterval(() => { if (!K.running){ clearInterval(w); done(); } }, 50); } else done();
}
$("#bRun").onclick = () => runCells(CELLS);
/* ---------- chạy từng ô: mỗi lần bấm chạy ô code kế tiếp, bỏ qua ghi chú ---------- */
let STEP_NEXT = null;
function markStep(c){
  STEP_NEXT = c || null;
  CELLS.forEach(x => x.el.classList.toggle("step-next", x === STEP_NEXT));
}
function nextCodeFrom(i){ for (let k = Math.max(0, i); k < CELLS.length; k++) if (CELLS[k].type === "code") return CELLS[k]; return null; }
$("#bStep").onclick = () => {
  if (K.running){ toast(t("stepBusy")); return; }
  let c = STEP_NEXT && CELLS.includes(STEP_NEXT) && STEP_NEXT.type === "code" ? STEP_NEXT : nextCodeFrom(STEP_NEXT ? CELLS.indexOf(STEP_NEXT) : 0);
  if (!c) c = nextCodeFrom(0);
  if (!c) return;
  setActive(c); c.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  runCells([c]);
  const n = nextCodeFrom(CELLS.indexOf(c) + 1);
  if (n) markStep(n); else { markStep(nextCodeFrom(0)); toast(t("stepDone")); }
};
$("#bStop").onclick = stopAll;
$("#bRestart").onclick = restartKernel;
$("#bAddCode").onclick = () => { const n = insertAfter(ACTIVE, makeCell("code", "")); n.ta.focus(); };
$("#bAddMd").onclick = () => { const n = insertAfter(ACTIVE, makeCell("md", "")); n.el.classList.add("editing"); n.ta.focus(); };
$("#bClear").onclick = () => CELLS.forEach(c => { c.out.innerHTML = ""; c.errbar.hidden = true; });
$("#bCopy").onclick = () => {
  const code = CELLS.filter(c => c.type === "code").map(c => c.src).join("\n\n");
  const fallback = () => { const ta = document.createElement("textarea"); ta.value = code; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(e){} ta.remove(); toast(t("copied")); };
  try { navigator.clipboard.writeText(code).then(() => toast(t("copied")), fallback); } catch (e) { fallback(); }
};
let escT = 0;
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){ const n = performance.now(); if (n - escT < 500 && K.running) stopAll(); escT = n; }
});

/* ---------- drawer: lessons + API ---------- */
const drawer = $("#drawer");
function openDrawer(which){
  const btn = which === "nb" ? $("#rNb") : $("#rApi"), other = which === "nb" ? $("#rApi") : $("#rNb");
  const on = btn.getAttribute("aria-pressed") !== "true";
  btn.setAttribute("aria-pressed", on); other.setAttribute("aria-pressed", "false");
  drawer.hidden = !on; DRAWER = on ? which : null; if (!on) return;
  renderDrawer(which);
}
let DRAWER = null;
function closeDrawer(){
  $("#rNb").setAttribute("aria-pressed", "false");
  $("#rApi").setAttribute("aria-pressed", "false");
  drawer.hidden = true; DRAWER = null;
}
function renderDrawer(which){
  if (which === "nb"){
    drawer.innerHTML = `<h3>${esc(t("drawerLessons"))}</h3>` + LESSONS.map(l0 => { const l = lessonIn(l0, LANG); return `<button class="lesson" data-id="${l.id}"><em>${esc(l.tag)} · ${esc(mapName(l.map).split(" · ")[0])}</em><b>${esc(l.title)}</b><span>${esc(l.desc)}</span></button>`; }).join("");
  } else {
    drawer.innerHTML = `<h3>${esc(t("drawerApi"))}</h3><div class="api">` + API.map(([cls, imp, fns]) =>
      `<h4>${cls}<small>${esc(imp)}</small></h4>` + fns.map(([code, d]) => `<div class="fn"><code>${esc(code)}</code><button class="ins" data-code="${esc(code)}">${esc(t("insert"))}</button><p>${esc(LANG === "en" && API_EN[code] ? API_EN[code] : d)}</p></div>`).join("")).join("") + "</div>";
  }
}
$("#rNb").onclick = () => openDrawer("nb");
$("#rApi").onclick = () => openDrawer("api");
drawer.addEventListener("click", e => {
  const l = e.target.closest(".lesson");
  if (l){ const L = lessonIn(LESSONS.find(x => x.id === l.dataset.id), LANG); setMap(L.map); loadCells(L.cells, L.file); if (innerWidth < 900) closeDrawer(); return; }
  const ins = e.target.closest(".ins");
  if (ins){
    let c = ACTIVE; if (!c || c.type !== "code") c = insertAfter(ACTIVE, makeCell("code", ""));
    const ta = c.ta, v = ta.value; ta.focus();
    if (ta.selectionStart === ta.selectionEnd && ta.selectionStart === 0 && v) ta.setSelectionRange(v.length, v.length);
    const pre = ta.selectionStart > 0 && v[ta.selectionStart - 1] !== "\n" ? "\n" : "";
    insertText(ta, pre + ins.dataset.code);
  }
});
document.addEventListener("pointerdown", e => {
  if (DRAWER && !drawer.contains(e.target) && !e.target.closest(".rail")) closeDrawer();
});
// Ảnh nhúng của ô ghi chú (chuẩn Jupyter): { "p1.png": { "image/png": "<base64>" } }. Chỉ nhận ảnh raster base64.
function sanitizeAtt(a){
  if (!a || typeof a !== "object" || Array.isArray(a)) return null;
  const out = {}; let n = 0;
  for (const name of Object.keys(a).slice(0, 50)){
    const d = a[name]; if (!d || typeof d !== "object") continue;
    for (const mime of Object.keys(d)){
      if (!/^image\/(png|jpeg|gif|webp)$/.test(mime)) continue;
      const v = (Array.isArray(d[mime]) ? d[mime].join("") : String(d[mime] || "")).replace(/\s+/g, "");
      if (v && v.length < 15e6 && /^[A-Za-z0-9+/]+=*$/.test(v)){ out[String(name).slice(0, 200)] = { [mime]: v }; n++; break; }
    }
  }
  return n ? out : null;
}
function sanitizeCells(list){
  if (!Array.isArray(list) || list.length > 300) return null;
  const out = [];
  for (const c of list){
    if (!Array.isArray(c) || (c[0] !== "code" && c[0] !== "md")) return null;
    const att = c[0] === "md" ? sanitizeAtt(c[2]) : null;
    out.push(att ? [c[0], String(c[1] == null ? "" : c[1]).slice(0, 100000), att] : [c[0], String(c[1] == null ? "" : c[1]).slice(0, 100000)]);
  }
  return out;
}
const safeName = n => String(n || "notebook.ipynb").replace(/[\u0000-\u001f<>]/g, "").slice(0, 120);
$("#rOpen").onclick = () => $("#fileIn").click();
function saveFile(){
  let name = safeName($("#nbTitle").value.trim()).replace(/[\\/:*?"|]/g, "-");
  if (!/\.ipynb$/i.test(name)) name = name.replace(/\.\w+$/, "") + ".ipynb";
  const lines = s => s.split(/(?<=\n)/);
  const nb = {
    cells: CELLS.map(c => c.type === "code"
      ? { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: lines(c.src) }
      : Object.assign({ cell_type: "markdown", metadata: {}, source: lines(c.src) }, c.att ? { attachments: c.att } : {})),
    metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python" }, jetbotlab: { map: MAPID } },
    nbformat: 4, nbformat_minor: 5
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(nb, null, 1)], { type: "application/x-ipynb+json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(t("saved") + name);
}
$("#rSave").onclick = saveFile;
$("#rNew").onclick = () => {
  if (CELLS.some(c => c.src.trim()) && !confirm(t("newConfirm"))) return;
  loadCells([["code", "from jetbot import Robot\nimport time\n\nrobot = Robot()\n"]], "notebook-moi.ipynb");
  toast(t("newDone"));
};
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s"){ e.preventDefault(); saveFile(); }
});
$("#fileIn").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 20*1024*1024){ toast(t("fileTooBig")); e.target.value = ""; return; }
  const r = new FileReader();
  r.onload = () => {
    try {
      if (/\.ipynb$/i.test(f.name)){
        const nb = JSON.parse(r.result);
        const list = sanitizeCells((Array.isArray(nb.cells) ? nb.cells : []).filter(x => x && (x.cell_type === "code" || x.cell_type === "markdown"))
          .map(x => [x.cell_type === "code" ? "code" : "md", Array.isArray(x.source) ? x.source.join("") : String(x.source || ""), x.attachments]));
        if (!list){ toast(t("badNotebook")); e.target.value = ""; return; }
        const m = nb.metadata && nb.metadata.jetbotlab && nb.metadata.jetbotlab.map;
        if (typeof m === "string" && Object.prototype.hasOwnProperty.call(MAPS, m)) setMap(m);
        loadCells(list.length ? list : [["code",""]], safeName(f.name));
      } else loadCells([["code", String(r.result).slice(0, 100000)]], safeName(f.name.replace(/\.\w+$/, ".ipynb")));
      toast(t("opened") + safeName(f.name));
    } catch (x){ toast(t("openFail")); }
    e.target.value = "";
  };
  r.readAsText(f);
});

/* ---------- splitter ---------- */
(() => {
  const sp = $("#split"), main = $("#main");
  sp.addEventListener("pointerdown", e => {
    sp.setPointerCapture(e.pointerId); sp.classList.add("drag");
    const mv = ev => { const r = main.getBoundingClientRect(); const p = Math.max(28, Math.min(72, (ev.clientX - r.left)/r.width*100)); main.style.setProperty("--lw", p + "%"); };
    const up = () => { sp.classList.remove("drag"); sp.removeEventListener("pointermove", mv); sp.removeEventListener("pointerup", up); };
    sp.addEventListener("pointermove", mv); sp.addEventListener("pointerup", up);
  });
})();

let toastT;
function toast(t){ const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2200); }

/* =====================================================================
   7. ĐỒ HOẠ 3D
   ===================================================================== */
const stage = $("#stage");
let renderer, scene, camera, controls, robot3d, fieldGroup, lidarPts, trail, gizmo, robotCam, ground;
const W2T = (x, y, z = 0) => new THREE.Vector3(x, z, -y);   // ROS (x,y,z) → three (x, y=z, z=-y)
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function std(color, o = {}){ return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0.1 }, o)); }
function box(w, h, d, mat){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m; }
function cyl(r, h, mat, seg = 24, r2){ const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, seg), mat); m.castShadow = true; m.receiveShadow = true; return m; }

function buildRobot(){
  // JetBot ROS AI Kit dựng theo ảnh thật (đơn vị m). Mũi robot hướng +x, gốc = tâm trục bánh trên mặt đất.
  const g = new THREE.Group(), parts = {};
  const green = std(0x1fa83a, { metalness: 0.45, roughness: 0.42 }), lime = std(0x8cc63f, { metalness: 0.45, roughness: 0.4 });
  const pcbBlack = std(0x15171a, { roughness: 0.55 }), black = std(0x0f1012, { roughness: 0.6 }), matte = std(0x1d1f22, { roughness: 0.75 });
  const brass = std(0xd4a640, { metalness: 0.8, roughness: 0.3 }), steel = std(0xc3c8cd, { metalness: 0.85, roughness: 0.28 });
  const tire = std(0x161616, { roughness: 0.92 }), blue = std(0x2149d6, { metalness: 0.9, roughness: 0.22 }), white = std(0xeeeeea, { roughness: 0.6 });
  const R = RB.D/2, WZ = RB.TRACK/2;
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };

  // --- Đế nhôm xanh: hình tròn Ø200 mm, khoét hai bên cho bánh xe
  const PR = 0.1, NX = 0.045, NZ = 0.066, ay = Math.atan2(Math.sqrt(PR*PR - NX*NX), NX);
  const sh = new THREE.Shape();
  sh.moveTo(NX, NZ); sh.lineTo(NX, PR*Math.sin(ay)); sh.absarc(0, 0, PR, ay, -ay, true);
  sh.lineTo(NX, -NZ); sh.lineTo(-NX, -NZ); sh.lineTo(-NX, -PR*Math.sin(ay)); sh.absarc(0, 0, PR, -(Math.PI - ay), -(Math.PI + ay), true);
  sh.lineTo(-NX, NZ); sh.lineTo(NX, NZ);
  const pg = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false, curveSegments: 48 }); pg.rotateX(-Math.PI/2);
  const plate = new THREE.Mesh(pg, green); plate.castShadow = plate.receiveShadow = true; add(plate, 0, 0.046, 0);
  for (const [x, z] of [[0.03, 0.05], [0.03, -0.05], [-0.05, 0.05], [-0.05, -0.05]]) add(cyl(0.0022, 0.001, steel, 10), x, 0.0495, z);

  // --- Hai động cơ DCGM-370 có encoder, nằm ngang dưới đế, trục ra bánh
  parts.wheels = [];
  for (const side of [1, -1]){
    const along = (m, zc) => { m.rotation.x = Math.PI/2; return add(m, 0, R, side*zc); };
    along(cyl(0.012, 0.007, black, 20), 0.012);                       // nắp encoder
    const con = add(box(0.008, 0.006, 0.006, white), 0.006, R + 0.012, side*0.012); // jack encoder
    along(cyl(0.0125, 0.03, steel, 24), 0.031);                      // thân motor
    along(cyl(0.0127, 0.004, std(0x222222), 24), 0.044);             // vòng nhãn
    along(cyl(0.0135, 0.024, steel, 24), 0.058);                     // hộp số
    along(cyl(0.002, 0.02, steel, 8), 0.078);                        // trục
    // giá chữ L màu xanh giữ motor
    add(box(0.032, 0.03, 0.003, green), 0, 0.031, side*0.071);
    // bánh xe Ø65 mm, mâm xanh dương 10 nan
    const spin = new THREE.Group(); spin.position.set(0, R, side*WZ);
    const t = cyl(R, 0.026, tire, 36); t.rotation.x = Math.PI/2; spin.add(t);
    const tread = new THREE.Mesh(new THREE.TorusGeometry(R - 0.001, 0.0025, 6, 40), tire); tread.position.z = side*0.008; spin.add(tread);
    const tread2 = tread.clone(); tread2.position.z = -side*0.008; spin.add(tread2);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0215, 0.0022, 8, 36), blue); rim.position.z = side*0.0125; spin.add(rim);
    const disc = cyl(0.021, 0.004, std(0x0c1640, { metalness: 0.6, roughness: 0.4 }), 28); disc.rotation.x = Math.PI/2; disc.position.z = side*0.009; spin.add(disc);
    for (let i = 0; i < 10; i++){
      const sp = box(0.017, 0.0032, 0.003, blue), a = i*Math.PI/5;
      sp.position.set(Math.cos(a)*0.0125, Math.sin(a)*0.0125, side*0.0125); sp.rotation.z = a; spin.add(sp);
    }
    const cap = cyl(0.005, 0.004, blue, 16); cap.rotation.x = Math.PI/2; cap.position.z = side*0.013; spin.add(cap);
    g.add(spin); parts.wheels.push(spin);
  }
  // --- Hai bánh xoay tự do ở đầu trước và đầu sau
  parts.casters = [];
  for (const fx of [0.075, -0.075]){
    add(box(0.028, 0.002, 0.028, steel), fx, 0.0455, 0);
    add(cyl(0.011, 0.007, steel, 20), fx, 0.041, 0);
    const sw = new THREE.Group(); sw.position.set(fx, 0, 0);
    for (const s of [1, -1]){ const f = box(0.02, 0.026, 0.0016, steel); f.position.set(-0.006, 0.026, s*0.0085); sw.add(f); }
    const cw = cyl(0.0125, 0.012, std(0x202020, { roughness: 0.8 }), 20); cw.rotation.x = Math.PI/2; cw.position.set(-0.008, 0.0125, 0); sw.add(cw);
    const ch = cyl(0.0055, 0.0135, steel, 12); ch.rotation.x = Math.PI/2; ch.position.set(-0.008, 0.0125, 0); sw.add(ch);
    g.add(sw); parts.casters.push(sw);
  }
  // đầu nối ăng-ten SMA mạ vàng phía sau đế
  for (const s of [1, -1]) add(cyl(0.0035, 0.008, brass, 12), -0.07, 0.053, s*0.055);

  // --- Cột đồng tầng 1 + mạch điều khiển Waveshare (RP2040, IMU, OLED) + hộc pin 3×18650 bên dưới
  for (const [x, z] of [[0.05, 0.04], [0.05, -0.04], [-0.055, 0.04], [-0.055, -0.04]]) add(cyl(0.0025, 0.032, brass, 6), x, 0.065, z);
  const DBY = 0.081;
  add(box(0.128, 0.0016, 0.09, pcbBlack), -0.002, DBY, 0);
  add(box(0.07, 0.02, 0.06, black), -0.005, DBY - 0.011, 0);                     // hộc pin
  for (let i = -1; i <= 1; i++){ const c = cyl(0.009, 0.064, std(0x2a63b8, { roughness: 0.35 })); c.rotation.z = Math.PI/2; add(c, -0.005, DBY - 0.012, i*0.019); }
  for (const s of [1, -1]){ const sp = cyl(0.011, 0.008, black, 20); add(sp, 0.045, DBY - 0.005, s*0.024); }   // loa
  const top = DBY + 0.0008;
  add(box(0.008, 0.0012, 0.008, black), 0.02, top + 0.0006, -0.025);              // RP2040
  add(box(0.004, 0.0012, 0.004, std(0x333438)), 0.0, top + 0.0006, 0.012);         // IMU
  for (let i = 0; i < 6; i++) add(box(0.005, 0.0015, 0.004, black), 0.03 + (i % 2)*0.008, top + 0.0007, 0.02 + Math.floor(i/2)*0.007);
  add(box(0.008, 0.004, 0.009, steel), 0.062, top + 0.002, 0.0);                   // Type-C
  add(box(0.006, 0.004, 0.012, std(0xdddddd)), -0.03, top + 0.002, 0.046);         // công tắc
  for (const z of [0.03, 0.016]) add(box(0.005, 0.003, 0.005, std(0xcccccc)), 0.06, top + 0.0015, z); // reset / boot
  const knob = cyl(0.006, 0.005, black, 18); add(knob, 0.055, top + 0.0025, -0.035);
  // OLED 0.91" ở mép sau
  const oc = document.createElement("canvas"); oc.width = 256; oc.height = 64;
  const otex = new THREE.CanvasTexture(oc);
  add(box(0.012, 0.0014, 0.032, black), -0.05, top + 0.0007, -0.005);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.0065), new THREE.MeshBasicMaterial({ map: otex }));
  scr.rotation.set(-Math.PI/2, 0, -Math.PI/2); scr.position.set(-0.05, top + 0.0016, -0.005); g.add(scr);

  // --- Jetson Nano + tản nhiệt đen + quạt
  const JY = DBY + 0.009;
  add(box(0.08, 0.0016, 0.1, std(0x101214)), 0.008, JY, 0);
  for (let i = 0; i < 4; i++) add(box(0.012, 0.007, 0.013, std(0x2c6ee6, { roughness: 0.4 })), -0.01 + (i % 2)*0.016, JY + 0.004 + (i > 1 ? 0.007 : 0), -0.044);
  add(box(0.016, 0.013, 0.016, steel), 0.022, JY + 0.007, -0.042);                // RJ45
  add(box(0.05, 0.004, 0.06, black), 0.008, JY + 0.004, 0);
  for (let i = 0; i < 10; i++) add(box(0.05, 0.016, 0.0016, matte), 0.008, JY + 0.014, -0.027 + i*0.006);
  add(box(0.04, 0.008, 0.04, black), 0.008, JY + 0.026, 0);                        // quạt

  // --- Tầng 2: tấm acrylic đen + cột đồng
  const TY = 0.125;
  for (const [x, z] of [[0.04, 0.035], [0.04, -0.035], [-0.04, 0.035], [-0.04, -0.035]]) add(cyl(0.0025, TY - DBY, brass, 6), x, (TY + DBY)/2, z);
  add(box(0.1, 0.003, 0.085, std(0x111214, { roughness: 0.25 })), 0, TY, 0);

  // --- RPLIDAR A1: 4 cột đen, đế hình giọt nước, motor phía sau, đầu quay Ø70 mm
  const LX = RB.LIDAR_OFF;
  for (const [x, z] of [[0.022, 0.022], [0.022, -0.022], [-0.022, 0.022], [-0.022, -0.022]]) add(box(0.005, 0.016, 0.005, black), LX + x, TY + 0.0095, z);
  add(cyl(0.037, 0.008, black, 40), LX, TY + 0.0215, 0);
  add(cyl(0.016, 0.008, black, 24), LX - 0.036, TY + 0.0215, 0);
  add(box(0.03, 0.008, 0.032, black), LX - 0.024, TY + 0.0215, 0);
  add(cyl(0.011, 0.016, steel, 20), LX - 0.036, TY + 0.01, 0);                     // motor lidar
  const lidarTop = new THREE.Group(); lidarTop.position.set(LX, TY + 0.0255, 0);
  const lt = cyl(0.035, 0.027, std(0x1c1e22, { roughness: 0.45, metalness: 0.25 }), 40); lt.position.y = 0.0135; lidarTop.add(lt);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0352, 0.0012, 6, 40), std(0x090909)); ring.rotation.x = Math.PI/2; ring.position.y = 0.004; lidarTop.add(ring);
  const logo = cyl(0.016, 0.0008, std(0x2a2c30, { metalness: 0.6, roughness: 0.3 }), 32); logo.position.y = 0.0274; lidarTop.add(logo);
  const win = box(0.004, 0.01, 0.018, std(0x220000, { emissive: 0x991100, emissiveIntensity: 0.55 })); win.position.set(0.034, 0.012, 0); lidarTop.add(win);
  g.add(lidarTop);

  // --- Camera góc rộng trên giá chữ L xanh nõn chuối + cáp dẹt trắng
  add(box(0.003, 0.068, 0.026, lime), 0.083, 0.0805, 0);
  add(box(0.012, 0.012, 0.003, lime), 0.089, 0.106, 0.016); add(box(0.012, 0.012, 0.003, lime), 0.089, 0.106, -0.016);
  for (const s of [1, -1]){ const k = cyl(0.003, 0.006, steel, 12); k.rotation.x = Math.PI/2; add(k, 0.089, 0.106, s*0.021); }
  const camG = new THREE.Group(); camG.position.set(0.096, 0.106, 0); camG.rotation.z = -0.26;
  const cpcb = box(0.003, 0.025, 0.024, std(0x111111)); camG.add(cpcb);
  const holderC = box(0.006, 0.009, 0.009, black); holderC.position.x = 0.0045; camG.add(holderC);
  const lens = cyl(0.0072, 0.013, black, 24); lens.rotation.z = Math.PI/2; lens.position.x = 0.013; camG.add(lens);
  const glass = cyl(0.0052, 0.001, std(0x1b2a44, { metalness: 0.95, roughness: 0.04 }), 20); glass.rotation.z = Math.PI/2; glass.position.x = 0.0196; camG.add(glass);
  const fpc = box(0.0015, 0.006, 0.016, std(0x2b56c9)); fpc.position.set(-0.0005, 0.014, 0); camG.add(fpc);
  g.add(camG);
  const ribbonPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0.094, 0.122, 0), new THREE.Vector3(0.085, 0.16, 0), new THREE.Vector3(0.06, 0.17, 0), new THREE.Vector3(0.045, 0.14, 0), new THREE.Vector3(0.035, 0.1, 0)]);
  const rib = new THREE.Mesh(new THREE.TubeGeometry(ribbonPath, 24, 0.0018, 4), white); rib.scale.z = 4; rib.castShadow = true; g.add(rib);

  const anchors = [
    ["Camera góc rộng", "", [0.11, 0.12, 0]], ["RPLIDAR A1", "360°", [LX, 0.182, 0]], ["IMU", "trên mạch Waveshare", [0.0, 0.084, 0.012]],
    ["Động cơ + encoder", "trái", [0, 0.03, -0.035]], ["Động cơ + encoder", "phải", [0, 0.03, 0.035]],
    ["Jetson Nano", "", [0.008, 0.124, 0.045]], ["OLED", "", [-0.05, 0.086, -0.005]], ["Pin 3×18650", "", [-0.005, 0.068, 0.03]],
    ["Bánh tự do", "trước", [0.075, 0.03, 0]], ["Bánh tự do", "sau", [-0.075, 0.03, 0]]
  ];
  return { g, parts, lidarTop, camG, oc, otex, anchors };
}
// Hệ trục gắn với robot, gốc tại tâm trục bánh (tâm quay tại chỗ): x mũi robot, y bên trái, z hướng lên.
function robotAxes(){
  const g = new THREE.Group(); g.renderOrder = 10;
  const ax = [["x", 0xe5483f, new THREE.Vector3(1, 0, 0), 0.22], ["y", 0x47b356, new THREE.Vector3(0, 0, -1), 0.22], ["z", 0x3a78dd, new THREE.Vector3(0, 1, 0), 0.3]];
  for (const [n, col, dir, len] of ax){
    const a = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0.002, 0), len, col, 0.035, 0.02);
    a.traverse(o => { if (o.material){ o.material.depthTest = false; o.material.transparent = true; } o.renderOrder = 10; });
    g.add(a);
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#" + col.toString(16).padStart(6, "0"); x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 36px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(n, 32, 34);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
    sp.position.copy(dir.clone().multiplyScalar(len + 0.025)).add(new THREE.Vector3(0, 0.002, 0)); sp.scale.set(0.035, 0.035, 1); sp.renderOrder = 11; g.add(sp);
  }
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), new THREE.MeshBasicMaterial({ color: 0x222222, depthTest: false, transparent: true }));
  o.position.y = 0.002; o.renderOrder = 11; g.add(o);
  g.traverse(x => { x.raycast = () => {}; });   // chỉ để nhìn: không cho trục "bắt" chuột (Line có ngưỡng chọn 1 m)
  return g;
}
function drawOled(){
  const c = robot3d.oc, x = c.getContext("2d");
  x.fillStyle = "#03060a"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#9fe7ff"; x.font = "bold 14px " + "JetBrains Mono, monospace"; x.textBaseline = "top";
  SIM.oled.forEach((t, i) => x.fillText(t, 6, 2 + i*15.5));
  robot3d.otex.needsUpdate = true; SIM.oledDirty = false;
}

function matTexture(){
  const S = 1000, cv = document.createElement("canvas"); cv.width = FIELD.w*S; cv.height = FIELD.h*S;
  const x = cv.getContext("2d"), P = (wx, wy) => [(wx + FIELD.w/2)*S, (FIELD.h/2 - wy)*S];
  x.fillStyle = "#f3f5f1"; x.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i <= 24; i++){ const px = i*100; x.strokeStyle = i % 5 === 0 ? "#b9c2b6" : "#dde3da"; x.lineWidth = i % 5 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, cv.height); x.stroke(); }
  for (let j = 0; j <= 16; j++){ const py = j*100; x.strokeStyle = j % 5 === 0 ? "#b9c2b6" : "#dde3da"; x.lineWidth = j % 5 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(0, py); x.lineTo(cv.width, py); x.stroke(); }
  x.fillStyle = "#8a958a"; x.font = "600 22px 'JetBrains Mono', monospace";
  for (let i = 0; i <= 24; i += 2){ const v = (i*10 - 120); x.fillText(String(v), i*100 + 6, cv.height - 10); }
  for (let j = 0; j <= 16; j += 2){ const v = (80 - j*10); if (j && j < 16) x.fillText(String(v), 8, j*100 - 8); }
  x.font = "600 24px 'Be Vietnam Pro', sans-serif"; x.fillStyle = "#8a958a"; x.fillText("cm", cv.width - 50, cv.height - 40);
  // axes
  const [ox, oy] = P(0, 0); x.lineWidth = 5;
  x.strokeStyle = "#d8403a"; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + 90, oy); x.stroke();
  x.strokeStyle = "#3fa34d"; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox, oy - 90); x.stroke();
  x.font = "700 24px 'JetBrains Mono', monospace"; x.fillStyle = "#d8403a"; x.fillText("x", ox + 96, oy + 8); x.fillStyle = "#3fa34d"; x.fillText("y", ox - 7, oy - 98);
  for (const z of MAP.zones){
    const [zx, zy] = P(z.x - z.w/2, z.y + z.h/2); x.fillStyle = ZONE[z.c]; x.globalAlpha = 0.85; x.fillRect(zx, zy, z.w*S, z.h*S); x.globalAlpha = 1;
    if (z.w > 0.2){ x.fillStyle = "#fff"; x.font = "700 34px 'Be Vietnam Pro', sans-serif"; x.textAlign = "center"; x.fillText(MAPID === "open" ? z.c.toUpperCase() : t("goal"), zx + z.w*S/2, zy + z.h*S/2 + 12); x.textAlign = "left"; }
  }
  if (MAP.line){
    x.strokeStyle = "#141414"; x.lineWidth = 25; x.lineJoin = "round"; x.beginPath();
    MAP.line.forEach((p, i) => { const [px, py] = P(p[0], p[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.stroke();
  }
  // START box
  const s = MAP.start, [sx, sy] = P(s.x, s.y);
  x.save(); x.translate(sx, sy); x.rotate(-s.th);
  x.setLineDash([16, 10]); x.strokeStyle = "#467000"; x.lineWidth = 5; x.strokeRect(-95, -115, 230, 230); x.setLineDash([]);
  x.fillStyle = "#467000"; x.beginPath(); x.moveTo(150, 0); x.lineTo(128, -14); x.lineTo(128, 14); x.fill();
  x.font = "700 26px 'Be Vietnam Pro', sans-serif"; x.fillText("START", -88, -124);
  x.restore();
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); return tex;
}
function buildField(){
  if (fieldGroup){ scene.remove(fieldGroup); fieldGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material){ if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  fieldGroup = new THREE.Group();
  const base = box(FIELD.w + 0.08, 0.018, FIELD.h + 0.08, std(0xcfd6cc)); base.position.y = -0.0095; fieldGroup.add(base);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.w, FIELD.h), new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.85 }));
  mat.rotation.x = -Math.PI/2; mat.position.y = 0.0005; mat.receiveShadow = true; fieldGroup.add(mat);
  const wallMat = std(0xe8dcc4, { roughness: 0.8 }), obMat = std(0xe0833a, { roughness: 0.55 }), mazeMat = std(0x6d7f99, { roughness: 0.6 });
  for (const b of BOXES){
    const h = b.wall ? 0.08 : MAPID === "maze" ? 0.18 : 0.22;
    const m = box(b.w, h, b.d, b.wall ? wallMat : MAPID === "maze" ? mazeMat : obMat);
    m.position.copy(W2T(b.x, b.y, h/2)); fieldGroup.add(m); if (!b.wall) m.userData.box = b;
    if (!b.wall && MAPID !== "maze"){ const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x7a3d10, transparent: true, opacity: 0.5 })); e.position.copy(m.position); fieldGroup.add(e); }
  }
  scene.add(fieldGroup); fieldGroup.updateMatrixWorld(true);
}
function initScene(){
  if (!window.THREE){ $("#sceneLoading").textContent = t("sceneFail"); return false; }
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  stage.prepend(renderer.domElement); $("#sceneLoading").remove();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.01, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9488, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(1.2, 2.6, 1.6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 1.2, bottom: -1.2, near: 0.5, far: 6 }); sun.shadow.bias = -0.0004;
  scene.add(sun);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1 }));
  ground.rotation.x = -Math.PI/2; ground.position.y = -0.019; ground.receiveShadow = true; scene.add(ground);
  robot3d = buildRobot(); scene.add(robot3d.g); drawOled();
  robot3d.axes = robotAxes(); robot3d.g.add(robot3d.axes);
  // lidar points
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(360*3), 3));
  lidarPts = new THREE.Points(lg, new THREE.PointsMaterial({ color: 0xff3b2f, size: 0.014 })); scene.add(lidarPts);
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(72*2*3), 3));
  lidarPts.rays = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.18 })); scene.add(lidarPts.rays);
  // trail
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6000*3), 3)); tg.setDrawRange(0, 0);
  trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0x2f6fd0 })); trail.n = 0; trail.frustumCulled = false; scene.add(trail);
  // robot camera
  robotCam = new THREE.PerspectiveCamera(58, 4/3, 0.01, 8);
  // gizmo
  gizmo = { scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 10) };
  const ax = [["X", 0xe5483f, new THREE.Vector3(1, 0, 0)], ["Y", 0x47b356, new THREE.Vector3(0, 0, -1)], ["Z", 0x3a78dd, new THREE.Vector3(0, 1, 0)]];
  for (const [n, col, dir] of ax){
    gizmo.scene.add(new THREE.ArrowHelper(dir, new THREE.Vector3(), 1, col, 0.28, 0.16));
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#" + col.toString(16).padStart(6, "0"); x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "bold 34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(n, 32, 34);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.position.copy(dir.clone().multiplyScalar(1.3)); sp.scale.set(0.5, 0.5, 1); gizmo.scene.add(sp);
  }
  // controls: chuột phải xoay, chuột giữa / cuộn phóng, chuột trái (nền) dời khung nhìn
  setupRobotDrag();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = true;
  controls.minDistance = 0.25; controls.maxDistance = 7; controls.maxPolarAngle = Math.PI*0.495;
  setView("iso", true);
  applyTheme(); buildField(); new ResizeObserver(resize).observe(stage); resize();
  return true;
}
function applyTheme(){
  if (!renderer) return;
  const bg = new THREE.Color(cssVar("--scene") || "#dde3dc");
  scene.background = bg; scene.fog = new THREE.Fog(bg, 4, 12);
  ground.material.color = bg.clone().multiplyScalar(0.93);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

function setFieldHidden(h){
  const b = $("#bField"), s = b.querySelector("span"), k = h ? "showField" : "hideField";
  $("#main").classList.toggle("nofield", h); b.setAttribute("aria-pressed", h);
  s.dataset.i18n = k; s.textContent = t(k); b.dataset.i18nTitle = k + "T"; b.title = t(k + "T");
  store.set("jetbotlab.nofield", h);
  if (!h && renderer) requestAnimationFrame(resize);
}
$("#bField").onclick = () => setFieldHidden(!$("#main").classList.contains("nofield"));
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
/* ---------- views ---------- */
let VIEW = "iso", tween = null, followLast = null;
const VIEWS = { iso: [0.95, 1.45, 2.0], top: [0, 2.9, 0.001], front: [0, 0.32, 2.5], side: [2.9, 0.32, 0] };
function setView(v, instant){
  VIEW = v; document.querySelectorAll("#views button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
  let pos, tgt;
  if (v === "follow"){
    const r = new THREE.Vector3(SIM.x, 0.05, -SIM.y);
    tgt = r; pos = r.clone().add(new THREE.Vector3(-Math.cos(SIM.th)*0.55, 0.38, Math.sin(SIM.th)*0.55));
    followLast = r.clone();
  } else { pos = new THREE.Vector3(...VIEWS[v]); tgt = new THREE.Vector3(0, 0, 0); followLast = null; }
  if (instant){ camera.position.copy(pos); controls.target.copy(tgt); controls.update(); return; }
  tween = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: pos, q1: tgt };
}
document.querySelectorAll("#views button").forEach(b => b.onclick = () => setView(b.dataset.v));

/* ---------- drag robot ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let drag = null;
function pick(e){
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1);
  ray.setFromCamera(ndc, camera);
}
function setupRobotDrag(){
  const el = renderer.domElement;
  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    pick(e);
    if (!ray.intersectObject(robot3d.g, true).length){ if (TG.edit) editBoxAt(e); return; }
    e.stopImmediatePropagation(); e.preventDefault();
    const p = new THREE.Vector3(); ray.ray.intersectPlane(plane, p);
    drag = { id: e.pointerId, dx: SIM.x - p.x, dy: SIM.y + p.z };
    SIM.dragging = true; el.setPointerCapture(e.pointerId); stage.classList.add("dragging");
  });
  el.addEventListener("pointermove", e => {
    if (!drag){
      if (e.buttons === 0){ pick(e); stage.classList.toggle("grab", ray.intersectObject(robot3d.g, true).length > 0); }
      return;
    }
    pick(e); const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, p)) return;
    const mx = FIELD.w/2 - 0.08, my = FIELD.h/2 - 0.08;
    SIM.x = Math.max(-mx, Math.min(mx, p.x + drag.dx)); SIM.y = Math.max(-my, Math.min(my, -p.z + drag.dy));
  });
  const end = e => {
    if (!drag) return; drag = null; SIM.dragging = false; stage.classList.remove("dragging");
    const s = MAP.start;
    if (Math.hypot(SIM.x - s.x, SIM.y - s.y) < 0.12){ homeRobot(); }
  };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("wheel", e => {
    if (!drag) return; e.preventDefault(); e.stopImmediatePropagation();
    SIM.th += (e.deltaY > 0 ? -1 : 1)*Math.PI/12;
  }, { capture: true, passive: false });
  el.addEventListener("contextmenu", e => e.preventDefault());
}
function editBoxAt(e){
  e.stopImmediatePropagation(); e.preventDefault();
  const hit = ray.intersectObjects(fieldGroup.children, false).find(h => h.object.userData.box);
  if (hit){ const b = hit.object.userData.box; MAP.boxes = MAP.boxes.filter(x => x !== b); }
  else {
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, p)) return;
    const s = 0.14, x = Math.round(p.x*100)/100, y = Math.round(-p.z*100)/100;
    if (Math.abs(x) > FIELD.w/2 - s/2 || Math.abs(y) > FIELD.h/2 - s/2) return;
    const qx = Math.max(x - s/2, Math.min(SIM.x, x + s/2)), qy = Math.max(y - s/2, Math.min(SIM.y, y + s/2));
    if (Math.hypot(qx - SIM.x, qy - SIM.y) < RB.RADIUS + 0.01){ toast(t("boxOnRobot")); return; }
    if (MAP.boxes.length >= 60) return;
    MAP.boxes = MAP.boxes.concat([{ x, y, w: s, d: s }]);
  }
  BOXES = allBoxes(); buildField(); saveBoxes();
}
$("#bBoxReset").onclick = () => { MAP.boxes = JSON.parse(BOX_DEFAULT[MAPID]); BOXES = allBoxes(); if (renderer) buildField(); saveBoxes(); toast(t("boxResetDone")); };
function homeRobot(){
  SIM.place(MAP.start, true); SIM.resetClock(); clearTrail(); toast(t("homeToast"));
}
function clearTrail(){ if (trail){ trail.n = 0; trail.geometry.setDrawRange(0, 0); } }
$("#bHome").onclick = () => { if (K.running) stopAll(); else SIM.setMotors(0, 0); homeRobot(); };

/* ---------- toggles ---------- */
const TG = { lidar: true, trail: true, cam: true, axis: true, edit: false, lbl: false, key: false };
function bindToggle(id, key, after){ const b = $(id); b.onclick = () => { TG[key] = !TG[key]; b.setAttribute("aria-pressed", TG[key]); after && after(); }; }
bindToggle("#tLidar", "lidar"); bindToggle("#tTrail", "trail"); bindToggle("#tCam", "cam"); bindToggle("#tAxis", "axis");
bindToggle("#tEdit", "edit", () => { $("#bBoxReset").style.display = TG.edit ? "" : "none"; stage.classList.toggle("editing", TG.edit); if (TG.edit) toast(t("editToast")); });
bindToggle("#tLbl", "lbl", () => { $("#labels").innerHTML = ""; if (TG.lbl && VIEW !== "follow") setView("follow"); });
bindToggle("#tKey", "key", () => { $("#teleopTag").hidden = !TG.key; if (!TG.key) SIM.setMotors(0, 0); else { document.activeElement && document.activeElement.blur && document.activeElement.blur(); toast(t("teleopToast")); } });
const keys = new Set();
function teleop(){
  if (!TG.key || K.running) return;
  const f = (keys.has("ArrowUp") || keys.has("w")) - (keys.has("ArrowDown") || keys.has("s"));
  const t = (keys.has("ArrowLeft") || keys.has("a")) - (keys.has("ArrowRight") || keys.has("d"));
  SIM.setMotors(0.45*f - 0.3*t, 0.45*f + 0.3*t);
}
addEventListener("keydown", e => {
  if (!TG.key || /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(k)){ e.preventDefault(); keys.add(k); teleop(); }
});
addEventListener("keyup", e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (keys.delete(k)) teleop(); });
addEventListener("blur", () => { keys.clear(); teleop(); });

/* ---------- map & speed ---------- */
const mapSel = $("#mapSel");
function renderMapSel(){ mapSel.innerHTML = Object.keys(MAPS).map(k => `<option value="${k}">${esc(mapName(k))}</option>`).join(""); mapSel.value = MAPID; }
renderMapSel();
function setMap(id){
  if (!MAPS[id]) id = "open";
  MAPID = id; MAP = MAPS[id]; BOXES = allBoxes(); mapSel.value = id; AI.inside = true;
  if (K.running) stopAll(); else SIM.setMotors(0, 0);
  SIM.place(MAP.start, true); SIM.resetClock(); clearTrail();
  if (renderer) buildField();
  save();
}
mapSel.onchange = () => setMap(mapSel.value);
let SPEED = 1; $("#speedSel").onchange = e => SPEED = Number(e.target.value);

/* ---------- AI tránh vật cản: ảnh camera, bộ dữ liệu free/blocked, mạng nơ-ron ---------- */
// Thay cho resnet18 + GPU của bản gốc: mạng 2 lớp (16×16×3 → 32 → 2) huấn luyện ngay trong trình duyệt.
const AI = { N: 16, S: 112, sets: {}, models: [], frames: new Map(), fid: 0, prob: null, probT: -1e9, inside: true };
const AI_MEAN = [0.485, 0.456, 0.406], AI_STD = [0.229, 0.224, 0.225];
let aiRT, aiCam, aiBuf;
const b64e = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const f32e = a => b64e(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
const f32d = s => { const u = b64d(s); return new Float32Array(u.buffer, 0, u.length >> 2); };
function aiRender(){
  if (!renderer) throw new Error(t("aiNoScene"));
  const S = AI.S, N = AI.N, B = S / N;
  if (!aiRT){ aiRT = new THREE.WebGLRenderTarget(S, S); aiCam = new THREE.PerspectiveCamera(64, 1, 0.01, 8); aiBuf = new Uint8Array(S*S*4); }
  robot3d.g.position.set(SIM.x, 0, -SIM.y); robot3d.g.rotation.y = SIM.th; robot3d.g.updateMatrixWorld(true);
  const cp = new THREE.Vector3(0.021, 0, 0).applyMatrix4(robot3d.camG.matrixWorld), lt = new THREE.Vector3(0.5, 0, 0).applyMatrix4(robot3d.camG.matrixWorld);
  aiCam.position.copy(cp); aiCam.up.set(0, 1, 0); aiCam.lookAt(lt);
  const hide = [lidarPts, lidarPts.rays, trail, robot3d.axes], vis = hide.map(o => o.visible); hide.forEach(o => o.visible = false);
  renderer.setRenderTarget(aiRT); renderer.setScissorTest(false); renderer.clear(); renderer.render(scene, aiCam);
  renderer.readRenderTargetPixels(aiRT, 0, 0, S, S, aiBuf); renderer.setRenderTarget(null);
  hide.forEach((o, i) => o.visible = vis[i]);
  const img = new ImageData(S, S);
  for (let y = 0; y < S; y++) img.data.set(aiBuf.subarray((S-1-y)*S*4, (S-y)*S*4), y*S*4);   // GL đọc từ dưới lên
  const feat = new Uint8Array(N*N*3);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (let c = 0; c < 3; c++){
    let s = 0; for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) s += img.data[((y*B + j)*S + x*B + i)*4 + c];
    feat[(y*N + x)*3 + c] = Math.round(s / (B*B));
  }
  return { img, feat };
}
function aiCapture(){
  const id = ++AI.fid; AI.frames.set(id, aiRender());
  if (AI.frames.size > 40) AI.frames.delete(AI.frames.keys().next().value);
  return id;
}
function aiFrame(id){ if (id < 0) return AI.frames.get(aiCapture()); const f = AI.frames.get(id); if (!f) throw new Error(t("aiOldFrame")); return f; }
function aiCanvas(img, px, cls){ const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d").putImageData(img, 0, 0); c.style.width = c.style.height = px + "px"; if (cls) c.className = cls; return c; }
function aiThumb(img){ const c = aiCanvas(img, 0); const s = document.createElement("canvas"); s.width = s.height = 64; s.getContext("2d").drawImage(c, 0, 0, 64, 64); return s.toDataURL("image/jpeg", 0.8); }
function aiPixels(feat){ const N = AI.N, im = new ImageData(N, N); for (let i = 0; i < N*N; i++){ im.data[i*4] = feat[i*3]; im.data[i*4+1] = feat[i*3+1]; im.data[i*4+2] = feat[i*3+2]; im.data[i*4+3] = 255; } return im; }
function aiOut(el){ if (K.cur) K.cur.out.appendChild(el); }
function aiSet(name){
  if (!AI.sets[name]){
    const raw = store.get("jetbotlab.ds.v1." + name);
    AI.sets[name] = Array.isArray(raw) ? raw.filter(r => r && (r.l === "free" || r.l === "blocked") && typeof r.f === "string").map(r => ({ l: r.l, f: b64d(r.f), t: String(r.t || "") })).filter(r => r.f.length === AI.N*AI.N*3) : [];
  }
  return AI.sets[name];
}
const aiSaveT = {};
function aiPersist(name){ clearTimeout(aiSaveT[name]); aiSaveT[name] = setTimeout(() => store.set("jetbotlab.ds.v1." + name, aiSet(name).map(r => ({ l: r.l, f: b64e(r.f), t: r.t }))), 300); }
function aiAdd(name, label, id){ const fr = aiFrame(id), set = aiSet(name); set.push({ l: label, f: fr.feat, t: aiThumb(fr.img) }); aiPersist(name); return set.filter(r => r.l === label).length; }
function aiCount(name, label){ const s = aiSet(name); return label ? s.filter(r => r.l === label).length : s.length; }
function aiGalleryEl(name, n){
  const g = document.createElement("div"); g.className = "aig"; const s = aiSet(name).slice(-Math.max(1, n));
  if (!s.length){ g.textContent = t("aiEmpty"); return g; }
  for (const r of s){ const f = document.createElement("figure"); f.className = r.l; f.innerHTML = `<img alt="" src="${r.t}"><figcaption>${r.l}</figcaption>`; g.appendChild(f); }
  return g;
}
function aiNudge(deg, d){
  if (K.running){ toast(t("stepBusy")); return; }
  SIM.setMotors(0, 0); SIM.vl = SIM.vr = 0;
  if (deg){ const th = SIM.th + deg*Math.PI/180; SIM.th = Math.atan2(Math.sin(th), Math.cos(th)); }
  if (d){
    const nx = SIM.x + d*Math.cos(SIM.th), ny = SIM.y + d*Math.sin(SIM.th), mx = FIELD.w/2 - 0.08, my = FIELD.h/2 - 0.08;
    if (SIM.collides(nx, ny) || Math.abs(nx) > mx || Math.abs(ny) > my){ toast(t("aiBump")); return; }
    SIM.x = nx; SIM.y = ny;
  }
}
function aiWidget(name){
  const w = document.createElement("div"); w.className = "aiw";
  w.innerHTML = `<div class="aiw-cam"><figure><canvas class="live" width="${AI.S}" height="${AI.S}"></canvas><figcaption>Camera 224×224</figcaption></figure>`
    + `<figure><canvas class="px" width="${AI.N}" height="${AI.N}"></canvas><figcaption>${esc(t("aiNetSees"))}</figcaption></figure></div>`
    + `<div class="aiw-pose"><span>${esc(t("aiPose"))}</span><button data-r="15">↺ 15°</button><button data-r="-15">↻ 15°</button><button data-r="90">↺ 90°</button><button data-r="-90">↻ 90°</button><button data-m="0.05">↑ 5 cm</button><button data-m="-0.05">↓ 5 cm</button></div>`
    + `<div class="aiw-btns"><button class="free" data-l="free"><b></b>add free</button><button class="blocked" data-l="blocked"><b></b>add blocked</button><button class="undo">${esc(t("aiUndo"))}</button></div><div class="aiw-gal"></div>`;
  const live = w.querySelector(".live").getContext("2d"), px = w.querySelector(".px").getContext("2d");
  const sync = () => {
    w.querySelector(".free b").textContent = aiCount(name, "free"); w.querySelector(".blocked b").textContent = aiCount(name, "blocked");
    w.querySelector(".aiw-gal").replaceChildren(aiGalleryEl(name, 8));
  };
  const draw = () => { try { const fr = aiRender(); live.putImageData(fr.img, 0, 0); px.putImageData(aiPixels(fr.feat), 0, 0); } catch (e) {} };
  w.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.r || b.dataset.m){ aiNudge(Number(b.dataset.r || 0), Number(b.dataset.m || 0)); draw(); return; }
    if (b.dataset.l){ try { aiAdd(name, b.dataset.l, -1); } catch (x){ toast(x.message); } }
    else if (b.classList.contains("undo")){ aiSet(name).pop(); aiPersist(name); }
    sync(); draw();
  });
  sync(); draw();
  const iv = setInterval(() => { if (!w.isConnected){ clearInterval(iv); return; } draw(); }, 250);
  aiOut(w);
}
function aiRand(){ let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function aiNewModel(H){
  H = Math.max(4, Math.min(128, H|0)); const D = AI.N*AI.N*3;
  const m = { H, D, W1: new Float32Array(H*D), b1: new Float32Array(H), W2: new Float32Array(2*H), b2: new Float32Array(2), ready: false };
  for (let i = 0; i < m.W1.length; i++) m.W1[i] = aiRand()*Math.sqrt(2/D);
  for (let i = 0; i < m.W2.length; i++) m.W2[i] = aiRand()*Math.sqrt(2/H);
  return m;
}
function aiInput(feat, flip, br, ct){
  const N = AI.N, x = new Float32Array(N*N*3);
  for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++){
    let v = feat[(y*N + (flip ? N-1-i : i))*3 + c]/255;
    if (ct !== 1 || br) v = Math.max(0, Math.min(1, (v - 0.5)*ct + 0.5 + br));
    x[(y*N + i)*3 + c] = (v - AI_MEAN[c]) / AI_STD[c];
  }
  return x;
}
function aiForward(m, x){
  const { H, D, W1, b1, W2, b2 } = m, z = new Float32Array(H), h = new Float32Array(H);
  for (let j = 0; j < H; j++){ let s = b1[j]; const o = j*D; for (let k = 0; k < D; k++) s += W1[o + k]*x[k]; z[j] = s; h[j] = s > 0 ? s : 0; }
  const o0 = b2[0] + h.reduce((a, v, j) => a + v*W2[j], 0), o1 = b2[1] + h.reduce((a, v, j) => a + v*W2[H + j], 0);
  const mx = Math.max(o0, o1), e0 = Math.exp(o0 - mx), e1 = Math.exp(o1 - mx);
  return { z, h, p: [e0/(e0 + e1), e1/(e0 + e1)] };   // lớp 0 = blocked, lớp 1 = free (ImageFolder xếp theo ABC)
}
function aiModel(h){ const m = AI.models[h]; if (!m) throw new Error(t("aiNotTrained")); return m; }
async function aiTrain(h, name, epochs, testSize, lr){
  const m = aiModel(h), set = aiSet(name).slice(), cell = K.cur, print = s => { if (cell) outText(cell, s); };
  const nb = set.filter(r => r.l === "blocked").length, nf = set.length - nb;
  if (nb < 4 || nf < 4) throw new Error(t("aiNeedData") + ` (free: ${nf}, blocked: ${nb})`);
  epochs = Math.max(1, Math.min(200, epochs|0)); lr = Math.max(1e-5, Math.min(0.5, lr || 0.001));
  for (let i = set.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [set[i], set[j]] = [set[j], set[i]]; }
  const nTest = Math.max(2, Math.min(set.length - 4, Math.round(set.length*(testSize > 0 && testSize < 1 ? testSize : 0.2))));
  const test = set.slice(0, nTest), train = set.slice(nTest), testX = test.map(r => aiInput(r.f, false, 0, 1));
  print(t("aiTrainHead").replace("{tr}", train.length).replace("{te}", test.length) + "\n");
  const { H, D } = m, BATCH = 8, MOM = 0.9, WD = 1e-4;
  const gW1 = new Float32Array(H*D), gb1 = new Float32Array(H), gW2 = new Float32Array(2*H), gb2 = new Float32Array(2);
  const vW1 = new Float32Array(H*D), vb1 = new Float32Array(H), vW2 = new Float32Array(2*H), vb2 = new Float32Array(2);
  let best = -1, bestW = null;
  for (let ep = 0; ep < epochs; ep++){
    if (K.stop) break;
    for (let i = train.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [train[i], train[j]] = [train[j], train[i]]; }
    for (let s = 0; s < train.length; s += BATCH){
      gW1.fill(0); gb1.fill(0); gW2.fill(0); gb2.fill(0);
      const batch = train.slice(s, s + BATCH);
      for (const r of batch){
        // ColorJitter + lật ngang để mô hình không học thuộc từng ảnh
        const x = aiInput(r.f, Math.random() < 0.5, (Math.random() - 0.5)*0.2, 1 + (Math.random() - 0.5)*0.2), f = aiForward(m, x);
        const d = [f.p[0] - (r.l === "blocked" ? 1 : 0), f.p[1] - (r.l === "free" ? 1 : 0)];
        for (let j = 0; j < H; j++){
          gW2[j] += d[0]*f.h[j]; gW2[H + j] += d[1]*f.h[j];
          if (f.z[j] <= 0) continue;
          const dz = d[0]*m.W2[j] + d[1]*m.W2[H + j], o = j*D; gb1[j] += dz;
          for (let k = 0; k < D; k++) gW1[o + k] += dz*x[k];
        }
        gb2[0] += d[0]; gb2[1] += d[1];
      }
      const n = batch.length, upd = (W, g, v) => { for (let i = 0; i < W.length; i++){ v[i] = MOM*v[i] - lr*(g[i]/n + WD*W[i]); W[i] += v[i]; } };
      upd(m.W1, gW1, vW1); upd(m.b1, gb1, vb1); upd(m.W2, gW2, vW2); upd(m.b2, gb2, vb2);
    }
    let ok = 0; test.forEach((r, i) => { const p = aiForward(m, testX[i]).p; if ((p[0] >= 0.5) === (r.l === "blocked")) ok++; });
    const acc = ok / test.length; print(ep + ": " + acc.toFixed(6) + "\n");
    if (acc > best){ best = acc; bestW = [m.W1.slice(), m.b1.slice(), m.W2.slice(), m.b2.slice()]; }
    await new Promise(r => setTimeout(r, 0));
  }
  if (bestW) [m.W1, m.b1, m.W2, m.b2] = bestW;
  m.ready = true; m.acc = best;
  return Math.max(0, best);
}
function aiSave(h, path){
  const m = aiModel(h); if (!m.ready) throw new Error(t("aiNotTrained"));
  try { localStorage.setItem("jetbotlab.model.v1." + path, JSON.stringify({ H: m.H, D: m.D, acc: m.acc, W1: f32e(m.W1), b1: f32e(m.b1), W2: f32e(m.W2), b2: f32e(m.b2) })); }
  catch (e){ throw new Error(t("aiSaveFail")); }
  if (K.cur) outText(K.cur, t("aiSaved") + path + "\n");
}
function aiLoad(h, path){
  const r = store.get("jetbotlab.model.v1." + path);
  if (!r || r.D !== AI.N*AI.N*3) throw new Error(t("aiNoModel").replace("{p}", path));
  const m = { H: r.H, D: r.D, acc: r.acc, W1: f32d(r.W1), b1: f32d(r.b1), W2: f32d(r.W2), b2: f32d(r.b2), ready: true };
  if (m.W1.length !== m.H*m.D || m.W2.length !== 2*m.H) throw new Error(t("aiNoModel").replace("{p}", path));
  AI.models[h] = m;
}
function aiPredict(h, id){
  const m = aiModel(h); if (!m.ready) throw new Error(t("aiNotTrained"));
  const p = aiForward(m, aiInput(aiFrame(id).feat, false, 0, 1)).p[0];
  AI.prob = p; AI.probT = performance.now();
  return Math.round(p*10000)/10000;
}
window.AIJS = {
  capture: aiCapture, add: aiAdd, count: aiCount, train: aiTrain, save: aiSave, load: aiLoad, predict: aiPredict, widget: aiWidget,
  show(id){ const fr = aiFrame(id); aiOut(aiCanvas(fr.img, 224, "aishot")); },
  pop(name){ aiSet(name).pop(); aiPersist(name); },
  clear(name){ aiSet(name).length = 0; aiPersist(name); },
  gallery(name, n){ aiOut(aiGalleryEl(name, n)); },
  newModel(H){ AI.models.push(aiNewModel(H)); return AI.models.length - 1; }
};
function inPoly(x, y, p){ let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++){ const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) c = !c; } return c; }

/* ---------- loop ---------- */
let lastT = performance.now(), teleT = 0, lidT = 0, simDebt = 0, pumping = false;
// Dừng đúng lúc time.sleep() hết hạn và nhường cho Python chạy tiếp trước khi mô phỏng thêm,
// để lệnh động cơ kế tiếp có hiệu lực đúng thời điểm (không trễ cả một khung hình).
// MessageChannel thay cho setTimeout(0): không bị trình duyệt kẹp tối thiểu 4 ms mỗi lần gọi lồng nhau.
const pumpCh = new MessageChannel(); pumpCh.port1.onmessage = () => simPump();
function simPump(){
  pumping = false;
  while (simDebt > 1e-9){
    const h = Math.min(simDebt, 1/240, Math.max(1e-4, SIM.nextWake() - SIM.t));
    SIM.step(h); simDebt -= h;
    if (SIM.woke){ SIM.woke = false; if (simDebt > 1e-9){ pumping = true; pumpCh.port2.postMessage(0); } return; }
  }
}
const FIELD_OFF = () => $("#main").classList.contains("nofield");
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT)/1000)*SPEED; lastT = now;
  simDebt = Math.min(simDebt + dt, 0.25);
  if (!pumping) simPump();
  if (!renderer || FIELD_OFF()) return;
  // robot pose
  robot3d.g.position.set(SIM.x, 0, -SIM.y); robot3d.g.rotation.y = SIM.th;
  robot3d.parts.wheels[0].rotation.z = -SIM.angR; robot3d.parts.wheels[1].rotation.z = -SIM.angL;
  robot3d.lidarTop.rotation.y = SIM.lidarAng;
  robot3d.axes.visible = TG.axis;
  { const v = (SIM.vl + SIM.vr)/2, w = (SIM.vr - SIM.vl)/RB.TRACK; if (Math.abs(v) + Math.abs(w) > 0.01){ robot3d.parts.casters.forEach((c, i) => { const fx = i ? -0.075 : 0.075, tgt = Math.atan2(w*fx, v); let d = tgt - c.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.rotation.y += d*0.2; }); } }
  if (SIM.oledDirty) drawOled();
  // trail
  if (TG.trail){
    const a = trail.geometry.attributes.position, k = trail.n;
    const lx = k ? a.array[(k-1)*3] : 1e9, lz = k ? a.array[(k-1)*3+2] : 1e9;
    if (Math.hypot(SIM.x - lx, -SIM.y - lz) > 0.008 && !SIM.dragging){
      if (k >= 6000){ a.array.copyWithin(0, 3000*3); trail.n = 3000; }
      a.setXYZ(trail.n++, SIM.x, 0.003, -SIM.y); a.needsUpdate = true; trail.geometry.setDrawRange(0, trail.n);
    }
  }
  trail.visible = TG.trail;
  // lidar viz 10 Hz
  lidarPts.visible = lidarPts.rays.visible = TG.lidar;
  if (TG.lidar && now - lidT > 100){
    lidT = now; const [ox, oy] = SIM.lidarOrigin(), pa = lidarPts.geometry.attributes.position, ra = lidarPts.rays.geometry.attributes.position;
    for (let i = 0; i < 360; i++){
      const d = SIM.lidarAt(i), an = SIM.th + i*Math.PI/180, px = ox + Math.cos(an)*d, py = oy + Math.sin(an)*d;
      pa.setXYZ(i, px, RB.LIDAR_H, -py);
      if (i % 5 === 0){ const j = i/5; ra.setXYZ(j*2, ox, RB.LIDAR_H, -oy); ra.setXYZ(j*2+1, px, RB.LIDAR_H, -py); }
    }
    pa.needsUpdate = ra.needsUpdate = true;
  }
  // camera tween / follow
  if (tween){
    const u = Math.min(1, (now - tween.t0)/450), e = u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2)/2;
    camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.q0, tween.q1, e);
    if (u >= 1) tween = null;
  } else if (VIEW === "follow" && followLast){
    const r = new THREE.Vector3(SIM.x, 0.05, -SIM.y), d = r.clone().sub(followLast);
    camera.position.add(d); controls.target.add(d); followLast.copy(r);
  }
  controls.update();
  // render main
  const w = stage.clientWidth, h = stage.clientHeight, pr = renderer.getPixelRatio();
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h); renderer.clear();
  renderer.render(scene, camera);
  // robot camera PiP
  const pipW = Math.round(Math.min(230, w*0.36)), pipH = Math.round(pipW*0.75), pipX = 10, pipY = 10;
  if (TG.cam){
    robot3d.camG.updateMatrixWorld();
    const cp = new THREE.Vector3(0.021, 0, 0).applyMatrix4(robot3d.camG.matrixWorld), lt = new THREE.Vector3(0.5, 0, 0).applyMatrix4(robot3d.camG.matrixWorld);
    robotCam.position.copy(cp); robotCam.up.set(0, 1, 0); robotCam.lookAt(lt);
    const vis = [lidarPts.visible, lidarPts.rays.visible, trail.visible, robot3d.axes.visible]; lidarPts.visible = lidarPts.rays.visible = false; trail.visible = false; robot3d.axes.visible = false;
    renderer.setScissorTest(true); renderer.setScissor(pipX, pipY, pipW, pipH); renderer.setViewport(pipX, pipY, pipW, pipH);
    renderer.clear(); renderer.render(scene, robotCam);
    [lidarPts.visible, lidarPts.rays.visible, trail.visible, robot3d.axes.visible] = vis;
  }
  const pf = $("#pipFrame"), pl = $("#pipLabel"); pf.hidden = pl.hidden = !TG.cam;
  if (TG.cam){ Object.assign(pf.style, { left: pipX - 1 + "px", bottom: pipY - 1 + "px", width: pipW + 2 + "px", height: pipH + 2 + "px" }); Object.assign(pl.style, { left: pipX + 6 + "px", bottom: pipY + pipH - 22 + "px" }); }
  const ap = $("#aiProb"), showP = now - AI.probT < 700; ap.hidden = !showP;
  if (showP){
    Object.assign(ap.style, { left: pipX + "px", bottom: (TG.cam ? pipY + pipH + 8 : pipY) + "px", width: pipW + "px" });
    ap.querySelector("i").style.width = (AI.prob*100).toFixed(1) + "%"; ap.querySelector("b").textContent = AI.prob.toFixed(2); ap.classList.toggle("hi", AI.prob >= 0.5);
  }
  if (MAP.fence){ const ins = inPoly(SIM.x, SIM.y, MAP.line); if (!ins && AI.inside && !SIM.dragging) toast(t("aiOut")); AI.inside = ins; }
  // gizmo
  const gs = 92; gizmo.cam.position.copy(camera.position).sub(controls.target).setLength(4); gizmo.cam.lookAt(0, 0, 0);
  renderer.setScissorTest(true); renderer.setScissor(w - gs - 6, h - gs - 6, gs, gs); renderer.setViewport(w - gs - 6, h - gs - 6, gs, gs);
  renderer.clearDepth(); renderer.render(gizmo.scene, gizmo.cam); renderer.setScissorTest(false);
  // labels
  if (TG.lbl){
    const L = $("#labels");
    if (!L.children.length) robot3d.anchors.forEach(([n, s]) => { const d = document.createElement("div"); d.className = "lbl"; d.innerHTML = esc(tA(n)) + (s ? `<small>${esc(tA(s))}</small>` : ""); L.appendChild(d); });
    robot3d.g.updateMatrixWorld();
    robot3d.anchors.forEach(([, , p], i) => {
      const v = new THREE.Vector3(...p).applyMatrix4(robot3d.g.matrixWorld).project(camera), el = L.children[i];
      el.style.display = v.z < 1 ? "" : "none"; el.style.left = (v.x*0.5 + 0.5)*w + "px"; el.style.top = (-v.y*0.5 + 0.5)*h - 6 + "px";
    });
  }
  if (now - teleT > 100){ teleT = now; telemetry(); }
}
function bar(el, v){ const p = Math.abs(v)*50; el.style.width = p + "%"; el.style.left = v >= 0 ? "50%" : (50 - p) + "%"; el.classList.toggle("neg", v < 0); }
function telemetry(){
  $("#tPos").textContent = `${(SIM.x*100).toFixed(1)}, ${(SIM.y*100).toFixed(1)}`;
  $("#tYaw").textContent = `${(SIM.th*180/Math.PI).toFixed(1)}°`;
  bar($("#mL"), SIM.cmd[0]); bar($("#mR"), SIM.cmd[1]);
  $("#tEnc").textContent = `${Math.round(SIM.encL)} / ${Math.round(SIM.encR)}`;
  $("#tLid").textContent = `${SIM.lidarAt(0).toFixed(3)} m`;
  const lp = SIM.linePos(), col = SIM.color();
  $("#tLine").textContent = lp === null ? (col ? `— · ${col}` : t("noLine")) : lp.toFixed(2) + (col ? ` · ${col}` : "");
  $("#tTime").textContent = SIM.runT.toFixed(1) + " s" + (K.running ? "" : t("stopped"));
}

/* =====================================================================
   8. KHỞI ĐỘNG
   ===================================================================== */
const saved = store.get("jetbotlab.nb.v1");
MAPID = saved && MAPS[saved.map] ? saved.map : "open"; MAP = MAPS[MAPID]; BOXES = allBoxes(); mapSel.value = MAPID;
SIM.place(MAP.start, true);
initScene();
if (store.get("jetbotlab.nofield") === true) setFieldHidden(true);
const savedCells = saved && sanitizeCells(saved.cells);
if (savedCells && savedCells.length) loadCells(savedCells, safeName(saved.title)); else { const L0 = lessonIn(LESSONS[0], LANG); loadCells(L0.cells, L0.file); }
function applyLang(prev){
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("#langSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === LANG));
  $("#kstat").textContent = t(KSTAT);
  renderMapSel(); renderAddRow();
  // bài mẫu chưa sửa thì đổi sang bản cùng ngôn ngữ
  if (prev && prev !== LANG && !K.running){
    const cur = JSON.stringify(CELLS.map(c => [c.type, c.src]));
    for (const l of LESSONS){
      const o = lessonIn(l, prev);
      if (JSON.stringify(o.cells) === cur){ const n = lessonIn(l, LANG); loadCells(n.cells, n.file); break; }
    }
  }
  CELLS.forEach(c => {
    c.ta.setAttribute("aria-label", t(c.type === "md" ? "cellMd" : "cellCode"));
    const g = c.el.querySelector(".grip"); g.title = t("grip"); g.setAttribute("aria-label", t("grip"));
    for (const [a, k] of [["up","cUp"],["down","cDown"],["type","cType"],["del","cDel"]]) c.el.querySelector(`[data-a="${a}"]`).title = t(k);
    if (c.md) paint(c); gutter(c);
  });
  if (DRAWER) renderDrawer(DRAWER);
  $("#labels").innerHTML = "";
  if (renderer) buildField();
  if (typeof telemetry === "function") telemetry();
}
document.querySelectorAll("#langSeg button").forEach(b => b.onclick = () => {
  if (b.dataset.lang === LANG) return;
  const prev = LANG; LANG = b.dataset.lang; store.set("jetbotlab.lang", LANG); applyLang(prev);
});
applyLang();
initKernel();
requestAnimationFrame(loop);
if (document.fonts) document.fonts.ready.then(() => { if (renderer) buildField(); drawOled && robot3d && drawOled(); });
