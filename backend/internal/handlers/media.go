package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"spicenrice/internal/models"
)

func (a *API) upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 9<<20)
	if err := r.ParseMultipartForm(9 << 20); err != nil {
		fail(w, 413, "Upload a JPEG or PNG under 8 MB")
		return
	}
	defer func() {
		if r.MultipartForm != nil {
			_ = r.MultipartForm.RemoveAll()
		}
	}()
	f, h, err := r.FormFile("file")
	if err != nil {
		fail(w, 400, "Choose an image")
		return
	}
	defer func() { _ = f.Close() }()
	if h.Size > 8<<20 {
		fail(w, 413, "Image exceeds 8 MB")
		return
	}
	cfg, format, err := image.DecodeConfig(f)
	if err != nil || (format != "jpeg" && format != "png") || cfg.Width > 10000 || cfg.Height > 10000 || cfg.Width*cfg.Height > 40000000 {
		fail(w, 422, "Use a JPEG or PNG up to 40 megapixels")
		return
	}
	if _, err = f.Seek(0, 0); err != nil {
		fail(w, 500, "Could not read image")
		return
	}
	b := make([]byte, 16)
	if _, err = rand.Read(b); err != nil {
		fail(w, 500, "Could not create image")
		return
	}
	name := hex.EncodeToString(b)
	input := filepath.Join(a.Uploads, name+".source")
	out, err := os.Create(input)
	if err != nil {
		fail(w, 500, "Could not store image")
		return
	}
	_, err = io.Copy(out, f)
	_ = out.Close()
	defer func() { _ = os.Remove(input) }()
	if err != nil {
		fail(w, 500, "Could not store image")
		return
	}
	for _, size := range []struct {
		suffix string
		width  string
	}{{"", "1600"}, {"-thumb", "400"}} {
		encoder := os.Getenv("CWEBP_PATH")
		if encoder == "" {
			encoder = "cwebp"
		}
		cmd := exec.CommandContext(r.Context(), encoder, "-quiet", "-q", "82", "-resize", size.width, "0", input, "-o", filepath.Join(a.Uploads, name+size.suffix+".webp"))
		if err = cmd.Run(); err != nil {
			_ = os.Remove(filepath.Join(a.Uploads, name+".webp"))
			fail(w, 503, "Image processing unavailable. Install cwebp on the server.")
			return
		}
	}
	data := models.Record{"name": h.Filename, "image": "/uploads/" + name + ".webp", "thumbnail": "/uploads/" + name + "-thumb.webp", "width": cfg.Width, "height": cfg.Height}
	id, err := a.Store.Save(r.Context(), "media", 0, data, 0)
	if err != nil {
		fail(w, 500, "Could not register image")
		return
	}
	data["id"] = id
	respond(w, 201, data)
}
