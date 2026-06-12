# Quick Start Guide - Frontend & Backend Connection

## 🎯 What's Connected

Your frontend and backend are now fully integrated! Here's what you can do:

### ✅ Working Features
1. **User Authentication** - Register, Login, Logout
2. **Dashboard** - Shows user interviews and analytics
3. **Interview Creation** - Configure and start mock interviews
4. **Real-time Communication** - WebSocket for live interview room
5. **Resume Upload** - Upload and parse resumes
6. **Coding Challenges** - View and submit coding problems
7. **Feedback System** - Get AI-generated feedback on interviews

---

## 🚀 Quick Setup (5 minutes)

### **1. Terminal 1 - Start Backend**
```bash
cd "c:\Users\SOHAM\Desktop\Ai interviewwer\Mock_Interview_AI-main\AI-Mock-Interview-Platform\Backend"
npm install
npm run start:dev
```
✅ Backend running on `http://localhost:4000`

### **2. Terminal 2 - Open Frontend**
```bash
# Just open this file in your browser
c:\Users\SOHAM\Desktop\Ai interviewwer\Mock_Interview_AI-main\AI-Mock-Interview-Platform\Frontend\webapp.html
```

### **3. Test Login**
- Click "Get Started Free"
- Enter any email: `test@example.com`
- Enter any password: `Test@1234`
- Click "Create Account"

✅ You're logged in! Dashboard shows your data.

---

## 📱 Testing the Features

### **Test 1: Create Interview**
1. Click "New Interview" in sidebar
2. Select options (Company: Google, Type: Technical, etc.)
3. Click "Start AI Interview"
4. ✅ Interview room opens with real-time connection

### **Test 2: Upload Resume**
1. Click "Resume Upload" in sidebar
2. Click upload zone
3. Select a PDF or DOCX file
4. ✅ Resume is parsed and displayed

### **Test 3: Coding Challenge**
1. Click "Coding Room" in sidebar
2. ✅ Coding problem loads with editor
3. Write solution and click "Run Code"

### **Test 4: View Feedback**
1. Complete an interview
2. Click "Analytics" or "Performance Report"
3. ✅ See AI-generated feedback

---

## 🔧 If Something Doesn't Work

### **Backend won't start?**
```bash
# Make sure you have dependencies
cd Backend
npm install

# Check if port 4000 is free
netstat -ano | findstr :4000

# Start in debug mode
npm run start:dev
```

### **Frontend won't connect?**
1. Check console for errors: Right-click → Inspect → Console
2. Verify backend is running: Visit `http://localhost:4000/docs`
3. Check API_BASE_URL in webapp.html matches your backend URL

### **API errors?**
- Check backend logs for detailed error messages
- Visit `http://localhost:4000/docs` to test API endpoints
- Use Postman to debug API calls

---

## 📋 What Each Part Does

### **Frontend (webapp.html)**
- **User Interface** - Landing page, dashboard, interview room, etc.
- **API Client** - Communicates with backend
- **WebSocket Client** - Real-time communication
- **State Management** - Tracks user, interviews, etc.

### **Backend (NestJS)**
- **REST APIs** - Create interviews, get feedback, etc.
- **WebSocket Server** - Real-time events during interviews
- **Database** - Stores users, interviews, resumes, etc.
- **AI Integration** - Claude AI for questions and feedback

---

## 🎓 Code Structure

### **API Calls Example**
```javascript
// Create interview
const interview = await APIClient.createInterview({
  type: 'Technical',
  company: 'Google',
  difficulty: 'Medium',
  duration: 45
});

// Get user data
const user = await APIClient.getCurrentUser();

// Upload resume
const resume = await APIClient.uploadResume(file);
```

### **WebSocket Example**
```javascript
// Connect to interview room
socket.emit('join', { interviewId: '123' });

// Listen for AI messages
socket.on('ai.message', (data) => {
  console.log('AI:', data.content);
});

// Send user message
socket.emit('user.message', { 
  interviewId: '123', 
  content: 'My answer is...' 
});
```

---

## 📊 Data Flow

```
Frontend                  Backend
─────────                 ───────

User enters email ───→ POST /auth/login
                  ←─── Returns token
                    
Click Interview  ───→ POST /interviews
                  ←─── Returns interview ID
                    
WebSocket join   ───→ socket.join(interviewId)
                  ←─── AI sends questions
                    
User responds    ───→ socket.emit('user.message')
                  ←─── AI analyzes & responds
                    
End interview    ───→ POST /interviews/:id/complete
                  ←─── Returns feedback report
```

---

## 🎯 Next Steps

After basic testing, you might want to:

1. **Add local database** - Replace mock data with real PostgreSQL
2. **Customize styling** - Modify CSS variables in webapp.html
3. **Add more AI features** - Custom prompts, advanced analytics
4. **Deploy to cloud** - AWS, Azure, Vercel, etc.
5. **Add payment** - Integrate Stripe for premium features
6. **Enable video** - Add user camera/microphone capture
7. **Add animations** - Enhance UI with transitions

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot reach backend" | Ensure backend running on port 4000 |
| "Login fails" | Check email/password, backend logs |
| "WebSocket disconnect" | Verify firewall allows WebSocket |
| "Resume upload fails" | Check file size < 10MB, format is PDF/DOCX |
| "Blank dashboard" | Clear browser cache, check localStorage |
| "API timeout" | Backend might be slow, check logs |

---

## 💡 Useful Commands

```bash
# Backend development
npm run start:dev           # Start with auto-reload
npm run lint               # Check code
npm run test               # Run tests
npm run build              # Production build

# Frontend
# Just refresh browser: Ctrl+R or Cmd+R

# Debugging
# Browser: Right-click → Inspect → Network/Console tabs
# Backend: Check terminal output
# API: Visit http://localhost:4000/docs
```

---

## 📞 Support

- **API Docs**: `http://localhost:4000/docs` (Swagger)
- **Backend README**: `Backend/README.md`
- **API Reference**: `Backend/API.md`
- **Frontend Code**: `Frontend/webapp.html`

---

**You're all set!** 🎉 

Start the backend, open the frontend, and start building! If you run into any issues, check the console in your browser (F12) or backend logs.
