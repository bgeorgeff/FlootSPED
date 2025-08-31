# Special Education Reading Support System
        
Build an App Solution for Special Education Reading Teachers and parents with struggling readers that addresses the pain points below. 
Based on extensive research across social media platforms, the following pain points and app solutions have been validated:
Validation of Primary Pain Points
Limited Teaching Materials & Resources is strongly validated, with social media comments consistently confirming this as a critical issue, such as special education teachers reporting a lack of free and great resources for reading and parents creating their own solutions.
Student Attention & Engagement is validated, with users noting that adjustable settings and inspiring reading experiences can benefit struggling readers.
Teacher Training & Support is validated, with studies showing that extensive support and training are required for efficient use of assistive technology and reviews highlighting the importance of easy navigation and creator expertise.
Age-Appropriate Content is strongly validated, with academic studies revealing a lack of diverse protagonists in apps and reviews mentioning reduced enthusiasm for reading among children.
Validation of App Solutions
Text-to-Speech Technology is overwhelmingly validated, with users praising built-in text-to-speech functionality and accessibility features.
Multisensory Learning Approaches are validated, with clinical studies showing improved reading comprehension and app reviews mentioning multi-sensory approaches.
Gamification and Engagement are validated, with users reporting high engagement and enjoyment with interactive reading experiences.
Market Gaps Confirmed by Social Media
Lack of Culturally Relevant Content is confirmed, with research showing a lack of human diversity in apps.
Poor Integration of Assessment Tools is confirmed, with users reporting difficulties with data navigation and report generation.
Cost and Accessibility Barriers are strongly confirmed, with users consistently mentioning cost as a barrier and preferring free alternatives.
Creative App Solutions Validated by User Needs
AI-Powered Personalization is an emerging demand, with evidence from reviews showing the potential for custom content creation.
XR/AR Integration is validated, with research showing increased engagement and learning with immersive experiences.
Universal Design Approach is confirmed, with users appreciating accessibility features and apps designed for individuals with disabilities receiving high ratings.
Key Insights from Social Media Validation
1. Users are creating their own solutions when existing ones fail, indicating significant market gaps.
2. There is resistance to subscription models, with users preferring free alternatives.
3. Users prefer high-quality features over many mediocre ones.
4. Community-driven development is key to successful apps.
5. Accessibility-first design is crucial, with apps prioritizing accessibility receiving higher ratings.

Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, request a `pg_dump` from support, upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
