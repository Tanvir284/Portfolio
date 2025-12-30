# 🚀 GitHub Deployment - EASY GUIDE

## What You Need:
- ✅ Git (you already have it!)
- ✅ GitHub account (visit [github.com](https://github.com) to create one if you don't have it)
- ✅ Your portfolio folder (you have this!)

---

## 🎬 **The 3 Main Steps**

```
Your Computer                GitHub Website               The Internet
    📁                    →      🌐          →         🌍 Live Site!
(Portfolio folder)        (Store online)            (Anyone can see)
```

---

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **STEP 1: Create a GitHub Account** (if you don't have one)

1. Go to [github.com](https://github.com)
2. Click **Sign Up**
3. Choose username: **Tanvir284** (you already have this!)
4. Complete registration

---

### **STEP 2: Create a Special Repository**

> **Repository** = A folder on GitHub where you store your code

1. Log into GitHub
2. Click the **+** icon (top right) → **New repository**
3. **Important**: Name it **exactly** like this: `Tanvir284.github.io`
   - This special name tells GitHub to host it as a website!
4. Keep it **Public**
5. Don't check any boxes
6. Click **Create repository**

**Screenshot Guide**:
- Repository name: `Tanvir284.github.io`
- Description: My Portfolio Website
- Public: ✅ (checked)
- Add README: ❌ (unchecked)

---

### **STEP 3: Upload Your Portfolio Using Commands**

After creating the repository, GitHub will show you a page. **Ignore it for now.**

#### **Open PowerShell in Your Portfolio Folder**:
1. Open File Explorer
2. Go to: `c:\Users\MD Tanvir Islam\Music\My_portfolio`
3. Right-click in the folder → **Open in Terminal** (or **Open PowerShell here**)

#### **Run These Commands One by One**:

I'll explain what each command does!

**Command 1**: Tell Git who you are (one-time setup)
```bash
git config --global user.name "Tanvir284"
git config --global user.email "ruhittanvir14@gmail.com"
```
*What it does: This tells Git your name and email*

---

**Command 2**: Initialize Git in your folder
```bash
git init
```
*What it does: Prepares your folder to track changes*

---

**Command 3**: Add all your files
```bash
git add .
```
*What it does: Selects all files to be uploaded (the dot `.` means "everything")*

---

**Command 4**: Create a snapshot (commit)
```bash
git commit -m "Initial portfolio upload"
```
*What it does: Saves a version of your files with a message*

---

**Command 5**: Rename branch to 'main'
```bash
git branch -M main
```
*What it does: Sets your main working branch name*

---

**Command 6**: Connect to GitHub
```bash
git remote add origin https://github.com/Tanvir284/Tanvir284.github.io.git
```
*What it does: Links your local folder to your GitHub repository*

---

**Command 7**: Upload to GitHub
```bash
git push -u origin main
```
*What it does: Uploads all your files to GitHub*

**⚠️ Authentication**: 
- GitHub will ask you to login
- A browser window might open
- Login with your GitHub account
- Click **Authorize**

---

### **STEP 4: Enable GitHub Pages** (Make it Live!)

1. Go to your repository: `https://github.com/Tanvir284/Tanvir284.github.io`
2. Click **Settings** tab (top of page)
3. Scroll down and click **Pages** (left sidebar)
4. Under **Source**, select **main** branch
5. Click **Save**
6. Wait 1-2 minutes

**🎉 Your site will be live at**: `https://tanvir284.github.io`

---

## 🔄 **How to Update Your Site Later**

Whenever you make changes to your portfolio:

```bash
git add .
git commit -m "Updated portfolio"
git push
```

That's it! Changes will appear on your live site in 1-2 minutes.

---

## 🆘 **Common Problems & Solutions**

### **Problem 1**: "Permission denied" when pushing
**Solution**: You need to authenticate with GitHub. Use a Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Give it a name and check "repo" permissions
4. Copy the token
5. When pushing, use token as password

### **Problem 2**: "Repository not found"
**Solution**: Make sure the repository name is EXACTLY `Tanvir284.github.io`

### **Problem 3**: "Site not loading"
**Solution**: Wait 2-3 minutes after pushing. GitHub Pages takes time to build.

---

## 🎯 **Quick Summary**

1. ✅ Create GitHub account
2. ✅ Create repository named `Tanvir284.github.io`
3. ✅ Run the 7 commands in PowerShell
4. ✅ Enable GitHub Pages in Settings
5. ✅ Visit `https://tanvir284.github.io` 🎉

---

## 💡 **Need Help?**

If you get stuck, I can help you run these commands step by step!
