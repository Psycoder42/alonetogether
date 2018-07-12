# AloneTogether - Virtual Social Interaction
AloneTogether is an online meeting place created by and for anti-social people. Why leave the house when you can get nearly all the same inter-personal interactions through the magic of the internet? Join AloneTogether and find out how great it feels to be social without even having to shower!

Get started by visiting the [website](https://alonetogether.herokuapp.com/) (modern Chrome browser is recommended).

### Under the Covers
This site was made with a NodeJS backend with an HTML, CSS, and jQuery frontend. The persistent data is stored in MongoDB. Backend node modules include (in no particular order) express, ejs, mongoose, express-session, serve-favicon, memorystore, method-override, and bcrypt.

The avatars used on this site were made by [Freepik](http://www.freepik.com/), found at [www.flaticon.com](https://www.flaticon.com/), and licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).

### Method Behind the Madness
I wanted to create a simplified social network site because I felt like, you know, there just aren't enough of them out there. I started out with just the log in functionality and the profile information. After that I added the friend mechanism and the direct messages. Unfortunately that didn't really make much of a site so I added the ability to post to your profile page. If looking at the page didn't make it obvious enough, I left the vast majority of the styling until the last day.

The longer I coded, the more I realized all of the parts of web pages that most of us take for granted like paging mechanisms, searching, asynchronous page updates, etc. Eventually I decided that I accomplished what I could for 6 days and stepped away.

### Known Issues
* The layout on some of the pages is awkward with poorly balanced blank space
* The color scheme could use a little more variety

### Potential Future Additions
* Fully implement the Admin/Moderation functionality
* Comments on posts
* A paging system for members, posts, and messages
* A search function for members, posts, and messages
* Additional themes/color schemes
