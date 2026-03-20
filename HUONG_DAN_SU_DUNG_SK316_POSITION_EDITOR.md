# 📐 HƯỚNG DẪN SỬ DỤNG: Chỉnh sửa Tọa độ SK316

## 🎯 Tổng quan

Tính năng **Chỉnh sửa Tọa độ SK316** cho phép bạn tự điều chỉnh vị trí của từng ảnh trong layout SK316 (90×54mm hoặc 85×54mm) với grid 2×5 (10 ảnh/trang A4).

---

## 📋 CÁCH SỬ DỤNG

### Bước 1: Chọn Preset SK316

1. **Mở Print Section** (tab "File in")
2. **Chọn một trong các preset SK316:**
   - **SK316 REAL** (`sk316-namecard-plus`): 90×54mm với tọa độ đã hiệu chuẩn
   - **SK316 8.5×5.4** (`sk316-55x85`): 85×54mm với tọa độ đã hiệu chuẩn

3. Sau khi chọn preset, **SK316 Position Editor** sẽ tự động hiển thị bên dưới phần cài đặt

---

### Bước 2: Chuyển sang chế độ chỉnh sửa

1. **Tìm SK316 Position Editor** (hiển thị sau khi chọn preset SK316)
2. **Bật toggle** "✏️ Chỉnh sửa tọa độ":
   ```
   [🔒 Tọa độ cố định] → Click toggle → [✏️ Chỉnh sửa tọa độ]
   ```
3. Khi toggle được bật:
   - Tất cả input fields được kích hoạt
   - Bảng danh sách ảnh xuất hiện
   - Preview canvas sẵn sàng cập nhật real-time

---

### Bước 3: Chỉnh sửa tọa độ

Có **2 cách** để chỉnh sửa tọa độ:

#### **Cách 1: Dùng Input Fields (Chính xác)**

1. **Tìm ảnh cần chỉnh** trong bảng danh sách (VD: R1C1, R1C2, R2C1...)
2. **Nhập trực tiếp** giá trị vào ô:
   - **X (mm)**: Tọa độ ngang (0-210mm)
   - **Y (mm)**: Tọa độ dọc (0-297mm)
3. **Nhấn Enter** hoặc click ra ngoài để áp dụng
4. **Canvas tự động cập nhật** ngay lập tức

**Ví dụ:**
```
R1C1: X = 13.5mm → Nhập 14.5mm → Enter
      → Ảnh di chuyển sang phải 1mm
      → Canvas preview cập nhật ngay
```

#### **Cách 2: Dùng Nút +/- (Điều chỉnh từng bước)**

1. **Tìm ảnh cần chỉnh** trong bảng
2. **Click nút + hoặc -**:
   - **+**: Tăng 0.1mm
   - **-**: Giảm 0.1mm
3. **Giữ nút** để tăng/giảm liên tục
4. **Canvas tự động cập nhật** real-time

**Ví dụ:**
```
R1C1: X = 13.5mm
      → Click nút "+" 5 lần
      → X = 14.0mm (tăng 0.5mm)
      → Canvas preview cập nhật ngay
```

#### **Cách 3: Dùng Nút Chọn ảnh (Highlight)**

1. **Click nút 👁️** ở cột "Thao tác"
2. **Hàng tương ứng được highlight** (màu xanh)
3. **Preview info** hiển thị: "👁️ Đang xem: R1C1 - X: 13.5mm, Y: 8.1mm"

---

### Bước 4: Xem Preview Canvas (Live)

Khi chỉnh sửa tọa độ:
- **Preview canvas** (bên phải) tự động cập nhật real-time
- **Ảnh di chuyển** đến vị trí mới ngay lập tức
- **Đường cắt** (cutting guides) tự động điều chỉnh theo vị trí mới

**Lưu ý:** Nếu không thấy preview, hãy:
1. Click nút "Xem trước" để generate preview
2. Đảm bảo đã chọn ảnh (ít nhất 10 ảnh cho grid 2×5)

---

### Bước 5: Validation (Tự động)

Hệ thống sẽ tự động kiểm tra:

1. **Boundary Check:**
   - X: 0 ≤ X ≤ 210mm (chiều rộng A4)
   - Y: 0 ≤ Y ≤ 297mm (chiều cao A4)
   - Nếu vượt quá: Tự động giới hạn về giá trị hợp lệ

2. **Blade Gap Check:**
   - Khoảng cách giữa các ảnh ≥ 3mm (SK316 requirement)
   - Nếu vi phạm: Hiển thị cảnh báo "⚠️ Khoảng cách giữa các ảnh phải >= 3mm"

3. **Visual Feedback:**
   - **Border xanh**: Tọa độ hợp lệ
   - **Border đỏ**: Tọa độ không hợp lệ (sẽ tự động sửa)

---

### Bước 6: Lưu tọa độ đã chỉnh sửa

1. Sau khi chỉnh sửa xong, click nút **"💾 Lưu"**
2. Hệ thống sẽ:
   - Validate tất cả positions
   - Lưu vào `printData.gridLayout.exactPositions`
   - Lưu vào localStorage (backup)
   - Áp dụng tọa độ mới vào layout
   - Cập nhật canvas

3. **Toast notification**: "✅ Đã lưu tọa độ chỉnh sửa"

---

### Bước 7: Reset về mặc định (nếu cần)

1. Click nút **"↺ Reset"**
2. Confirm dialog: "Reset tất cả tọa độ về mặc định?"
3. Hệ thống sẽ:
   - Restore từ `sk316OriginalPositions`
   - Cập nhật lại bảng
   - Reset canvas về vị trí gốc
   - Toast: "🔄 Đã reset tất cả tọa độ về mặc định"

---

## 🔄 CHẾ ĐỘ DUPLEX (In 2 mặt)

### Auto-Mirror (Tự động đồng bộ)

Khi ở **Duplex Mode** (In 2 mặt):

1. **Chỉnh sửa tọa độ ở mặt trước** (Front)
2. **Mặt sau (Back) tự động được cập nhật** với tọa độ mirror:

   **Long-edge flip (Mặc định):**
   ```
   Mặt trước: X = 13.5mm, Y = 8.1mm
   Mặt sau:   X = 105.5mm (210 - 13.5 - 90), Y = 8.1mm (giữ nguyên)
   ```

   **Short-edge flip:**
   ```
   Mặt trước: X = 13.5mm, Y = 8.1mm
   Mặt sau:   X = 13.5mm (giữ nguyên), Y = 233.8mm (297 - 8.1 - 54)
   ```

3. **Visual Indicator:**
   - Hiển thị: "🔄 Đã đồng bộ: Mặt trước 14.5mm → Mặt sau 105.5mm (X)"
   - Duplex sync indicator được bật tự động

4. **Canvas tự động render lại cả 2 mặt** khi chỉnh sửa

---

## 🎨 MINH HỌA GIAO DIỆN

### Khi chưa bật chế độ chỉnh sửa:
```
┌─────────────────────────────────────────────┐
│ 📐 Chỉnh sửa tọa độ SK316                   │
│                                             │
│ [🔒 Tọa độ cố định] [✏️ Chỉnh sửa tọa độ]  │
│      (OFF)          (Toggle switch)         │
│                                             │
│ 💡 Bật toggle để chỉnh sửa tọa độ           │
└─────────────────────────────────────────────┘
```

### Khi đã bật chế độ chỉnh sửa:
```
┌─────────────────────────────────────────────────────────────┐
│ 📐 Chỉnh sửa tọa độ SK316                                   │
│                                                             │
│ [🔒 Tọa độ cố định] [✏️ Chỉnh sửa tọa độ] ✓                │
│                                             (Đã bật)        │
│                                                             │
│ ┌───────────────────────┬─────────────────────────────────┐ │
│ │ 📋 Danh sách ảnh      │  📊 Preview Canvas (Live)       │ │
│ │                       │                                 │ │
│ │ STT | Ô  | X (mm)    │  ┌─────────────────────────┐   │ │
│ │ ───┼────┼─────────── │  │   ┌──┐  ┌──┐            │   │ │
│ │  1 |R1C1| 13.5 [+][-]│  │   │1 │  │2 │            │   │ │
│ │  2 |R1C2|105.5 [+][-]│  │   └──┘  └──┘            │   │ │
│ │  3 |R2C1| 13.5 [+][-]│  │   ┌──┐  ┌──┐            │   │ │
│ │ ...│... │ ... [+][-] │  │   │3 │  │4 │            │   │ │
│ │ 10 |R5C2|105.5 [+][-]│  │   └──┘  └──┘            │   │ │
│ │                       │  │   ...                   │   │ │
│ │ [↺ Reset] [💾 Lưu]    │  └─────────────────────────┘   │ │
│ │                       │                                 │ │
│ │ 🔄 Tự động đồng bộ:   │  💡 Chỉnh sửa tọa độ bên trái   │ │
│ │    Mặt trước ↔ Mặt sau│     để xem preview              │ │
│ └───────────────────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 MINH HỌA CƠ CHẾ HOẠT ĐỘNG

### 1. Chỉnh sửa Tọa độ (Single Mode):

```
User chỉnh sửa:
  R1C1: X = 13.5mm → 14.5mm (tăng 1mm)
    ↓
Hệ thống cập nhật:
  - exactPositions[0].x = 14.5
  - currentLayout.exactPositions[0].x = 14.5
  - gridLayout.exactPositions[0].x = 14.5
    ↓
Canvas render lại:
  - Ảnh #1 di chuyển sang phải 1mm
  - Cutting guides tự động điều chỉnh
  - Preview cập nhật ngay lập tức
    ↓
User thấy kết quả ngay trên canvas
```

### 2. Chỉnh sửa Tọa độ (Duplex Mode):

```
User chỉnh sửa mặt trước:
  Front R1C1: X = 13.5mm → 14.5mm
    ↓
Hệ thống tự động tính mirror cho mặt sau:
  Back X = 210 - 14.5 - 90 = 105.5mm
  Back Y = 8.1mm (giữ nguyên - long-edge flip)
    ↓
Hệ thống cập nhật:
  - Front exactPositions[0].x = 14.5
  - Back được tính toán tự động khi render
    ↓
Canvas render lại CẢ HAI MẶT:
  - Front canvas: Ảnh #1 ở X = 14.5mm
  - Back canvas: Ảnh #1 ở X = 105.5mm (mirror)
    ↓
Visual indicator:
  "🔄 Đã đồng bộ: Mặt trước 14.5mm → Mặt sau 105.5mm (X)"
```

---

## ⚙️ CÁC TÍNH NĂNG CHI TIẾT

### A. Toggle Chế độ

- **OFF (Mặc định)**: "🔒 Tọa độ cố định"
  - Tất cả input fields bị disable
  - Không thể chỉnh sửa
  - Dùng tọa độ gốc từ preset

- **ON (Editable)**: "✏️ Chỉnh sửa tọa độ"
  - Tất cả input fields được enable
  - Có thể chỉnh sửa tự do
  - Preview canvas cập nhật real-time

### B. Bảng Danh sách Ảnh

**Cấu trúc:**
```
STT | Ô   | X (mm)        | Y (mm)        | Thao tác
────┼─────┼──────────────┼──────────────┼──────────
 1  | R1C1| 13.5 [+][-]   |  8.1 [+][-]   |  [👁️]
 2  | R1C2|105.5 [+][-]   |  8.1 [+][-]   |  [👁️]
 3  | R2C1| 13.5 [+][-]   | 64.3 [+][-]   |  [👁️]
...
10 | R5C2|105.5 [+][-]   |233.8 [+][-]   |  [👁️]
```

**Các cột:**
- **STT**: Số thứ tự (1-10)
- **Ô**: Nhãn vị trí trong grid (R1C1, R1C2, ... R5C2)
- **X (mm)**: Tọa độ ngang (có thể chỉnh sửa)
- **Y (mm)**: Tọa độ dọc (có thể chỉnh sửa)
- **Thao tác**: Nút chọn ảnh (highlight)

### C. Nút Điều khiển

1. **Nút +/-**:
   - **+**: Tăng 0.1mm
   - **-**: Giảm 0.1mm
   - Click liên tục để tăng/giảm nhanh

2. **Nút 👁️ (Select)**:
   - Highlight hàng tương ứng
   - Scroll đến hàng đó (smooth scroll)
   - Hiển thị preview info

3. **Nút 💾 Lưu**:
   - Validate tất cả positions
   - Lưu vào config
   - Áp dụng vào layout
   - Toast notification

4. **Nút ↺ Reset**:
   - Confirm dialog
   - Restore về tọa độ gốc
   - Reset bảng và canvas

### D. Preview Canvas (Live)

**Hiển thị:**
- Ảnh ở vị trí mới (real-time)
- Đường cắt (cutting guides) tự động điều chỉnh
- Grid helper lines (nếu bật)
- Coordinate overlay khi hover

**Cập nhật:**
- Tự động cập nhật khi chỉnh sửa
- Smooth animation (nếu có)
- Không cần click "Refresh"

---

## 🔍 VALIDATION & CONSTRAINTS

### 1. Boundary Validation

**Giới hạn:**
- X: 0mm ≤ X ≤ 210mm (chiều rộng A4)
- Y: 0mm ≤ Y ≤ 297mm (chiều cao A4)

**Xử lý:**
- Nếu < 0: Tự động set = 0mm
- Nếu > max: Tự động set = max
- Border input: Đỏ (invalid), Xanh (valid)

### 2. Blade Gap Validation (SK316)

**Yêu cầu:**
- Khoảng cách giữa các ảnh ≥ 3mm (SK316 blade gap)

**Kiểm tra:**
- Tính khoảng cách giữa các ảnh
- Nếu < 3mm: Cảnh báo + border đỏ
- Nếu ≥ 3mm: OK + border xanh

**Ví dụ:**
```
R1C1: X = 13.5mm, Width = 90mm → Right edge = 103.5mm
R1C2: X = 105.5mm, Width = 90mm → Left edge = 105.5mm
Gap = 105.5 - 103.5 = 2.0mm ❌ (Phải >= 3mm)

→ Cảnh báo: "⚠️ Khoảng cách giữa các ảnh phải >= 3mm"
→ Border đỏ
→ Tự động điều chỉnh về 3mm
```

### 3. Overlap Check

**Kiểm tra:**
- Không cho phép ảnh chồng lên nhau
- Nếu overlap: Cảnh báo + tự động điều chỉnh

---

## 🔄 DUPLX MODE - AUTO MIRROR

### Cơ chế Auto-Mirror

Khi ở **Duplex Mode**, hệ thống tự động mirror tọa độ khi chỉnh sửa mặt trước:

#### Long-edge Flip (Mặc định):

```
Front Position (mm):        Back Position (mm):
X = 13.5, Y = 8.1    →      X = 105.5, Y = 8.1
                            (210 - 13.5 - 90 = 105.5)

Công thức:
backX = paperWidth - frontX - imageWidth
backY = frontY (giữ nguyên)
```

#### Short-edge Flip:

```
Front Position (mm):        Back Position (mm):
X = 13.5, Y = 8.1    →      X = 13.5, Y = 233.8
                            (297 - 8.1 - 54 = 233.8)

Công thức:
backX = frontX (giữ nguyên)
backY = paperHeight - frontY - imageHeight
```

### Visual Feedback

Khi chỉnh sửa trong Duplex Mode:
```
User chỉnh: R1C1 X = 13.5mm → 14.5mm
    ↓
Hệ thống hiển thị:
┌────────────────────────────────────────┐
│ 🔄 Đã đồng bộ:                         │
│    Mặt trước: 14.5mm                   │
│    Mặt sau: 105.5mm (mirror)           │
│    (X axis, Long-edge flip)            │
└────────────────────────────────────────┘
```

---

## 💾 LƯU & KHÔI PHỤC

### Lưu Tọa độ

1. Click **"💾 Lưu"**
2. Hệ thống validate tất cả positions
3. Nếu hợp lệ:
   - Lưu vào `printData.gridLayout.exactPositions`
   - Lưu vào localStorage (backup)
   - Áp dụng vào layout
   - Toast: "✅ Đã lưu tọa độ chỉnh sửa"

4. Nếu không hợp lệ:
   - Hiển thị lỗi: "❌ Lỗi tại R1C1: Khoảng cách..."
   - Dừng lại, không lưu
   - User cần sửa lại

### Reset về Mặc định

1. Click **"↺ Reset"**
2. Confirm: "Reset tất cả tọa độ về mặc định?"
3. Nếu OK:
   - Restore từ `sk316OriginalPositions`
   - Reset bảng về giá trị gốc
   - Reset canvas về vị trí gốc
   - Toast: "🔄 Đã reset tất cả tọa độ về mặc định"

### Export JSON (Tùy chọn - nếu có)

Có thể export tọa độ đã chỉnh sửa ra JSON để:
- Backup
- Chia sẻ với người khác
- Import lại sau này

---

## 📌 LƯU Ý QUAN TRỌNG

### 1. Chỉ áp dụng cho SK316 Layout

- Tính năng chỉ hoạt động với preset SK316:
  - `sk316-namecard-plus` (SK316 REAL)
  - `sk316-55x85` (SK316 8.5×5.4)
- Với preset khác: Position editor sẽ tự động ẩn

### 2. Tọa độ tính bằng mm (millimeters)

- Tất cả giá trị nhập vào đều là **mm**
- Hệ thống tự động convert sang px khi render
- Giới hạn: X (0-210mm), Y (0-297mm)

### 3. Blade Gap 3mm (Bắt buộc)

- Khoảng cách giữa các ảnh **PHẢI >= 3mm**
- Đây là yêu cầu của máy cắt SK316
- Nếu vi phạm: Hệ thống sẽ cảnh báo và tự động điều chỉnh

### 4. Duplex Mode - Tự động Mirror

- Khi chỉnh sửa mặt trước, mặt sau tự động cập nhật
- **KHÔNG THỂ** chỉnh sửa mặt sau độc lập
- Mirroring dựa trên `duplexFlip` setting (long-edge/short-edge)

### 5. Preview Canvas Real-time

- Canvas cập nhật ngay khi chỉnh sửa
- Không cần click "Refresh"
- Nếu không thấy preview: Đảm bảo đã chọn đủ ảnh (10 ảnh)

---

## 🎯 VÍ DỤ SỬ DỤNG

### Scenario 1: Điều chỉnh vị trí ảnh R1C1

```
Bước 1: Chọn preset "SK316 REAL"
  → Position editor hiển thị

Bước 2: Bật toggle "✏️ Chỉnh sửa tọa độ"
  → Input fields được enable

Bước 3: Tìm R1C1 trong bảng (hàng đầu tiên)

Bước 4: Chỉnh sửa X:
  - Click vào ô X
  - Nhập: 14.5 (thay vì 13.5)
  - Nhấn Enter

Bước 5: Xem kết quả:
  - Canvas preview: Ảnh #1 di chuyển sang phải 1mm
  - Toast: "✅ Đã cập nhật R1C1: X = 14.5mm"

Bước 6: Nếu ở Duplex Mode:
  - Back R1C1 tự động: X = 105.5mm (mirror)
  - Indicator: "🔄 Đã đồng bộ: Mặt trước 14.5mm → Mặt sau 105.5mm"

Bước 7: Click "💾 Lưu" để lưu tọa độ mới
```

### Scenario 2: Điều chỉnh nhiều ảnh

```
Bước 1: Chọn preset "SK316 8.5×5.4"
Bước 2: Bật toggle "✏️ Chỉnh sửa tọa độ"

Bước 3: Chỉnh sửa từng ảnh:
  - R1C1: X = 18.5 → 19.5mm (tăng 1mm)
  - R1C2: X = 105.5 → 104.5mm (giảm 1mm)
  - R2C1: Y = 64.3 → 65.3mm (tăng 1mm)
  - ...

Bước 4: Sau mỗi lần chỉnh:
  - Canvas tự động cập nhật
  - Validation tự động kiểm tra

Bước 5: Khi hoàn tất:
  - Click "💾 Lưu" để lưu tất cả
  - Hệ thống validate toàn bộ
  - Nếu OK: Lưu thành công
```

### Scenario 3: Reset về mặc định

```
Bước 1: Đã chỉnh sửa nhiều ảnh
Bước 2: Muốn quay về tọa độ gốc
Bước 3: Click "↺ Reset"
Bước 4: Confirm: "Reset tất cả tọa độ về mặc định?"
Bước 5: Click OK
Bước 6: Tất cả tọa độ về giá trị gốc từ preset
```

---

## ⚠️ TROUBLESHOOTING

### Vấn đề 1: Position Editor không hiển thị

**Nguyên nhân:**
- Chưa chọn preset SK316
- Preset khác đang active

**Giải pháp:**
- Chọn lại preset SK316 (SK316 REAL hoặc SK316 8.5×5.4)
- Editor sẽ tự động hiển thị

### Vấn đề 2: Input fields bị disabled

**Nguyên nhân:**
- Chưa bật toggle "✏️ Chỉnh sửa tọa độ"

**Giải pháp:**
- Bật toggle ở header của Position Editor
- Input fields sẽ được enable

### Vấn đề 3: Canvas không cập nhật

**Nguyên nhân:**
- Chưa chọn ảnh (selectedImages = 0)
- Layout chưa được tính toán

**Giải pháp:**
- Chọn ít nhất 10 ảnh cho grid 2×5
- Click "Xem trước" để generate preview
- Canvas sẽ cập nhật

### Vấn đề 4: Duplex Mode không mirror

**Nguyên nhân:**
- Print mode không phải 'duplex'
- duplexFlip setting không đúng

**Giải pháp:**
- Đảm bảo Print Mode = "Duplex" (2 mặt)
- Kiểm tra duplexFlip = 'long-edge' hoặc 'short-edge'
- Mirror sẽ tự động hoạt động

### Vấn đề 5: Validation lỗi liên tục

**Nguyên nhân:**
- Blade gap < 3mm
- Tọa độ vượt quá boundary
- Ảnh overlap

**Giải pháp:**
- Kiểm tra khoảng cách giữa các ảnh ≥ 3mm
- Đảm bảo 0 ≤ X ≤ 210mm, 0 ≤ Y ≤ 297mm
- Điều chỉnh lại tọa độ cho hợp lệ

---

## ✅ CHECKLIST SỬ DỤNG

- [ ] Chọn preset SK316 (SK316 REAL hoặc SK316 8.5×5.4)
- [ ] Position Editor tự động hiển thị
- [ ] Bật toggle "✏️ Chỉnh sửa tọa độ"
- [ ] Input fields được enable
- [ ] Chọn đủ 10 ảnh cho grid 2×5
- [ ] Click "Xem trước" để generate preview
- [ ] Chỉnh sửa tọa độ theo nhu cầu
- [ ] Xem preview canvas cập nhật real-time
- [ ] Validation tự động kiểm tra
- [ ] Click "💾 Lưu" khi hoàn tất
- [ ] Nếu cần: Click "↺ Reset" để quay về mặc định

---

## 📚 TÓM TẮT NHANH

1. **Chọn preset SK316** → Editor hiển thị
2. **Bật toggle** "✏️ Chỉnh sửa tọa độ"
3. **Chỉnh sửa** tọa độ trong bảng (input hoặc nút +/-)
4. **Xem preview** canvas cập nhật real-time
5. **Validation** tự động kiểm tra (boundary, blade gap)
6. **Lưu** tọa độ khi hoàn tất
7. **Duplex mode**: Mặt sau tự động mirror từ mặt trước

---

Chúc bạn sử dụng thành công! 🎉
