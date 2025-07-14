# VNotes 📝

A minimalist, secure note-taking web application with dark/light themes built for simplicity and productivity.

![VNotes Demo](assets/demo.gif)

## Features

- ** Simple Note Management**: Create, edit, and delete notes effortlessly
- ** Dark/Light Theme Toggle**: Switch between themes with a single click
- ** Local Storage**: Your notes are saved locally in your browser
- ** Responsive Design**: Works perfectly on desktop, tablet, and mobile
- ** Security Features**: XSS protection, input validation, and rate limiting
- ** Fast & Lightweight**: No server required, instant loading
- ** Accessibility**: WCAG compliant with ARIA support
- ** Modern UI**: Clean, minimalist interface with smooth animations

## Live Demo

Visit the live application: [VNotes](https://yourusername.github.io/vnotes/)

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: localStorage API
- **Deployment**: GitHub Pages
- **Security**: Input sanitization, XSS protection, rate limiting

##  Project Structure

```
vnotes/
├── index.html          
├── about.html          
├── css/
│   └── style.css       
├── js/
│   ├── app.js          
│   └── theme.js        
├── assets/
│   ├── notes.png       
│   └── favicon.png     
├── README.md           
└── .gitignore          
```

##  Getting Started

### Option 1: Use Online
Simply visit the [live demo](https://yourusername.github.io/vnotes/)

### Option 2: Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vnotes.git
   cd vnotes
   ```

2. Open `index.html` in your browser or serve it locally:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

##  Usage

1. **Create a Note**: Click the "Add Note" button
2. **Edit a Note**: Click the "Edit" button on any note card
3. **Delete a Note**: Click the "Delete" button (with confirmation)
4. **Toggle Theme**: Use the theme switch in the header
5. **Responsive**: Works on all screen sizes

##  Security Features

- **XSS Protection**: All user input is properly sanitized and escaped
- **Input Validation**: Title (100 chars max), Content (10,000 chars max)
- **Rate Limiting**: Prevents spam actions (300ms cooldown)
- **Data Validation**: Strict note structure validation
- **Error Handling**: Graceful error recovery with user feedback

##  Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling in modals
- **Color Contrast**: WCAG AA compliant color schemes
- **Semantic HTML**: Proper heading hierarchy and structure

##  Themes

### Dark Theme (Default)
- Background: `#121212` with darker accents
- Text: White with gray variations
- Modern, eye-friendly design

### Light Theme
- Background: White with light gray accents
- Text: Dark gray with proper contrast
- Clean, professional appearance

##  Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Bug Reports

If you find a bug, please open an issue on GitHub with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and version

##  Deployment

### GitHub Pages
1. Fork this repository
2. Go to Settings > Pages
3. Select source: "Deploy from a branch"
4. Choose branch: `main`
5. Your app will be available at `https://yourusername.github.io/vnotes/`

### Other Platforms
- **Netlify**: Drag and drop the project folder
- **Vercel**: Connect your GitHub repository
- **Surge**: Run `surge` in the project directory

##  Future Enhancements

- [ ] Export notes to JSON/CSV
- [ ] Import notes from files
- [ ] Search functionality
- [ ] Categories and tags
- [ ] Rich text editor
- [ ] Keyboard shortcuts
- [ ] PWA features (offline support)
- [ ] Print functionality

## Author

Created with ❤️ by Dimvalas.

---

⭐ If you found this project helpful, please give it a star on GitHub!
