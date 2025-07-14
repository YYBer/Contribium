# Contribium

A comprehensive bounty platform built on the Alephium blockchain where sponsors can post bounties and users can submit solutions to earn rewards.

## 🚀 Quick Start

### Installation
```bash
npm i
```

### Development
```bash
npm run dev
```

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production Deployment (Docker)
When deploying to production, you need to configure OAuth for your production domain:

#### 1. Update Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your production domain to **Site URL**: `https://contribium.alephium.org`
4. Add your production domain to **Redirect URLs**: `https://contribium.alephium.org/**`
5. Remove or update any localhost URLs if they exist

#### 2. Update Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project and navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID (the one with ID: `462777738555-bq4ndv04kn3trf8tuuhi10i5ne9ll9pn.apps.googleusercontent.com`)
4. In **Authorized JavaScript origins**, add: `https://contribium.alephium.org`
5. In **Authorized redirect URIs**, add: `https://wawxluhjdnqewiaexvvk.supabase.co/auth/v1/callback`
6. Remove any localhost URLs from both sections
7. Click **Save**

#### 3. Setup GitHub OAuth Configuration
1. Go to [GitHub](https://github.com/) and navigate to **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App** or edit existing one
3. Fill in the application details:
   - **Application name**: `Contribium`
   - **Homepage URL**: `https://contribium.alephium.org`
   - **Authorization callback URL**: `https://wawxluhjdnqewiaexvvk.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID** and **Client Secret**
6. In your Supabase dashboard, go to **Authentication** → **Providers** → **GitHub**
7. Enable GitHub provider and paste your Client ID and Client Secret
8. Click **Save**

Without proper OAuth configuration, authentication providers will reject requests from your production domain.

## 🎯 Features

### For Users (Contributors)

#### **Authentication & Profile Management**
- **Social Login**: Google and GitHub authentication
- **Profile Management**: Edit bio, skills, experience, and contact information
- **Wallet Integration**: Add Alephium wallet addresses for payments
- **Social Links**: Connect Twitter, LinkedIn, GitHub, and personal websites
- **Skills Management**: Categorized skills (Frontend, Backend, Blockchain, Design, Content)
- **Avatar Management**: Upload and manage profile pictures
- **Portfolio Building**: Showcase personal projects and work

#### **Bounty Discovery & Participation**
- **Browse Bounties**: View all available bounties with advanced filtering
- **Category Filtering**: Filter by Content, Design, Development, Other
- **Search Functionality**: Search bounties by title and sponsor
- **Status Filtering**: View open and completed bounties
- **Sorting Options**: Sort by creation date, deadline, reward amount
- **Detailed Views**: Full bounty descriptions, requirements, and timelines

#### **Submission System**
- **Easy Submission**: Submit work with title, description, and links
- **URL Validation**: Ensure submission URLs are accessible
- **Social Media Integration**: Optional Twitter/X link sharing
- **Submission Tracking**: Real-time status updates
- **My Submissions**: View all personal bounty submissions
- **Feedback System**: Receive sponsor feedback on submissions

#### **Rewards & Achievements**
- **Tiered Rewards**: Multi-tier prize distribution system
- **Earnings Tracking**: Track cumulative rewards earned
- **USD/ALPH Conversion**: Automatic currency conversion
- **Achievement Metrics**: Completion stats, success rates
- **Reputation Building**: Build reputation through successful submissions

#### **Competition & Leaderboard**
- **Global Rankings**: View top performers across the platform
- **Performance Metrics**: Total earnings, submission count, success rate
- **User Ranking**: See personal ranking and position
- **Achievement Badges**: Recognition for top contributors

#### **Communication Features**
- **Comment System**: Comment on bounties and engage in discussions
- **Reply System**: Nested conversations with real-time updates
- **Like System**: Like and interact with comments
- **Real-time Notifications**: Instant notifications for activities
- **Notification Management**: Mark as read, delete notifications

#### **Bug Bounty Program**
- **Severity Levels**: Critical, High, Medium, Low classifications
- **Reward Tiers**: Up to $50,000 for critical vulnerabilities
- **Responsible Disclosure**: Clear guidelines for bug reports
- **Scope Definition**: Clear in-scope and out-of-scope items

### For Sponsors (Organizations)

#### **Sponsor Profile Management**
- **Profile Creation**: Multi-step onboarding with validation
- **Company Information**: Name, description, website, social links
- **Profile Pictures**: Upload and manage company avatars
- **Verification System**: Verified sponsor badges
- **Social Media Integration**: Twitter, GitHub, Discord links
- **Profile Statistics**: Display total bounties and rewards

#### **Bounty Creation & Management**
- **Bounty Creation**: Complete posting interface with rich descriptions
- **Category Selection**: Development, design, content, and other categories
- **Reward Configuration**: USD-based rewards with ALPH token payments
- **Tiered Rewards**: Multi-tier prize system (1st, 2nd, 3rd place)
- **Date Management**: Start and end date configuration
- **Difficulty Levels**: Beginner, intermediate, and advanced classifications
- **Submission Guidelines**: Custom guidelines for submissions
- **Bounty Editing**: Full editing capabilities for existing bounties

#### **Submission Review & Approval**
- **Submission Dashboard**: Comprehensive review interface
- **Accept/Reject Actions**: Status updates with detailed feedback
- **Submission Details**: View URLs, descriptions, and user information
- **User Wallet Integration**: Easy access to payment addresses
- **Feedback System**: Provide detailed feedback to submitters
- **Real-time Updates**: Live submission tracking
- **Submission Filtering**: Filter by status (pending, accepted, rejected)

#### **Payment & Reward Management**
- **Reward Amount Setting**: Configure USD amounts for bounties
- **Transaction Tracking**: Record payment transaction hashes
- **ALPH Token Integration**: Payments in ALPH at USD equivalent
- **Tiered Reward Management**: Configure multiple prize tiers
- **Payment Status Tracking**: Monitor payment completion
- **Automatic Conversion**: USD to ALPH conversion handling

#### **Analytics & Reporting**
- **Overview Statistics**: Total bounties, projects, and rewards
- **Bounty Analytics**: Track bounty performance and engagement
- **Submission Analytics**: View submission counts per bounty
- **Performance Metrics**: Success rates and completion statistics
- **Historical Data**: Track performance over time
- **Public Profile Stats**: Display achievements publicly

#### **Communication Tools**
- **Submission Feedback**: Provide detailed feedback on submissions
- **Status Communication**: Communicate acceptance/rejection with reasons
- **User Profile Access**: View submitter profiles and previous work
- **Comment Engagement**: Participate in bounty discussions
- **Notification System**: Send updates for submission status changes

## 🛠 Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Vite
- **Authentication**: Supabase Auth with Google/GitHub OAuth
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Payments**: Alephium blockchain integration
- **State Management**: React Context API with custom hooks
- **UI Components**: Radix UI with custom theming
- **Notifications**: React Hot Toast for user feedback

## 🎨 User Experience

- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Mode**: Toggle between themes with persistence
- **Real-time Updates**: Live data synchronization
- **Form Validation**: Comprehensive input validation
- **Security**: Secure authentication and data protection
- **Performance**: Optimized for fast loading and smooth interactions

## 💡 Getting Started

1. **For Users**: Sign up with Google/GitHub → Complete profile → Browse bounties → Submit solutions
2. **For Sponsors**: Sign up → Create sponsor profile → Post bounties → Review submissions → Distribute rewards
3. **How to check my submission**: Sign up → Profile → My Submissions

## 🔒 Security & Privacy

- **Secure Authentication**: OAuth via Google/GitHub
- **Wallet Security**: Secure wallet address management
- **Data Protection**: Privacy controls and data validation
- **Content Moderation**: Spam prevention and content monitoring
- **Account Security**: Session management and protection