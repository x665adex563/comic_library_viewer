# Comic Library Viewer

A local manga viewer built with Python, HTML, CSS, and JavaScript.

It scans local manga folders, generates browser-based comic index and reading pages, and supports web viewing.

## Features

- Local manga library
- Web viewing
- Vertical and single-page reading
- Reading history

## Supported Image Formats

- JPG / JPEG
- PNG
- WebP

## Getting Started

### Requirements

- Python 3
- Node.js and npm (for building the Tailwind CSS stylesheet)

### Installation

1. Clone or download this repository.
2. Install the frontend dependencies:

   ```bash
   npm install
   ```

3. Build the CSS:

   ```bash
   npm run build:css
   ```

### Run

Start the application:

```bash
python main.py
```

1. Select a local manga folder from the folder picker.
2. The application scans the selected folder and generates the HTML viewer. This may take a few seconds for large collections.
3. The generated index page opens automatically in your default browser.
4. Bookmark the generated page URL for future access. You only need to run `main.py` again when you add or modify manga content.

Generated pages and related output are stored in `_comic_viewer_output/` under the project directory.

## Project Structure

```text
comic_library_viewer/
├── assets/
│   ├── js/                 # Reading and interaction modules
│   ├── tailwind.css        # Tailwind CSS source
│   └── tailwind-output.css # Generated stylesheet
├── templates/
│   ├── index.html          # Manga library index template
│   ├── chapter.html        # Manga reading page template
│   └── item.html           # Library item template
├── _comic_viewer_output/  # Generated HTML pages
├── main.py                 # Application entry point
├── viewer.py               # Folder scanning and HTML generation
├── package.json            # Frontend scripts and dependencies
└── README.md
```

## Technologies

- Python
- Tkinter
- HTML / CSS / JavaScript
- Tailwind CSS v4

## Notes

- All data stays on your local device. Nothing is uploaded to a server.
