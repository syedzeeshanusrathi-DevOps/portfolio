// ── AI Chat Widget ────────────────────────────────────────
(function () {
  const KB = [
    {
      keys: ['skill', 'tech', 'stack', 'know', 'use', 'tool', 'language', 'cloud'],
      answer:
        'Syed is skilled in <strong>AWS, Azure & GCP</strong> for cloud engineering, <strong>Terraform & Ansible</strong> for IaC, <strong>Docker & Kubernetes</strong> for containers, and <strong>Jenkins & GitHub Actions</strong> for CI/CD pipelines. He also works with Prometheus and Grafana for observability.',
    },
    {
      keys: ['project', 'work', 'built', 'case study', 'portfolio', 'demo'],
      answer:
        'Three featured projects stand out: <strong>Jerney 3-Tier App</strong> (cloud-native 3-tier architecture), <strong>AWS CI/CD Deployment</strong> (automated delivery pipeline), and a <strong>Terraform Project</strong> (reusable IaC modules). You can check all repos on his GitHub.',
    },
    {
      keys: ['experience', 'year', 'background', 'career', 'history', 'long', 'job', 'role', 'work history', 'company', 'position'],
      answer:
        'Syed has <strong>8+ years</strong> of progressive cloud & DevOps experience:<br><br>' +
        '• <strong>Senior DevOps Engineer</strong> (2022–Present) — multi-cloud platform engineering, 70% faster deployments, AI-assisted infra analysis<br>' +
        '• <strong>Cloud Infrastructure Engineer</strong> (2019–2022) — AWS/Terraform IaC, AI-driven cost optimisation saving 35% monthly<br>' +
        '• <strong>Full Stack Developer</strong> (2018–2020) — built web apps with React, Node.js & Python, RESTful APIs, PostgreSQL & MongoDB<br>' +
        '• <strong>Systems & Infra Engineer</strong> (2015–2017) — hybrid cloud foundations, 60% less manual toil<br><br>' +
        'Check the <a href="#experience" style="color:#38bdf8">Experience section</a> for the full timeline.',
    },
    {
      keys: ['contact', 'hire', 'reach', 'email', 'linkedin', 'connect', 'available', 'freelance'],
      answer:
        'You can reach Syed at <strong>syedzeeshanusrathi@gmail.com</strong>, connect on <a href="https://www.linkedin.com/in/syedzeeshan-tech" target="_blank" style="color:#38bdf8">LinkedIn</a>, or find him on <a href="https://github.com/syedzeeshanusrathi-DevOps" target="_blank" style="color:#38bdf8">GitHub</a>. He is open to freelance and full-time opportunities.',
    },
    {
      keys: ['devops', 'cicd', 'pipeline', 'automation', 'deploy', 'kubernetes', 'docker', 'container'],
      answer:
        'DevOps is Syed\'s core focus. He designs CI/CD pipelines with Jenkins & GitHub Actions, automates infra with Terraform & Ansible, orchestrates workloads with <strong>Kubernetes</strong>, and containerises services with <strong>Docker</strong> — all following GitOps and IaC best practices.',
    },
    {
      keys: ['aws', 'amazon'],
      answer:
        'Syed has deep AWS expertise: EC2, ECS, EKS, S3, IAM, VPC, CodePipeline, and more. His AWS CI/CD Deployment project showcases secure, automated build and delivery on AWS.',
    },
    {
      keys: ['azure', 'microsoft'],
      answer:
        'Syed works with Azure for enterprise cloud deployments, including Azure DevOps pipelines, AKS (Azure Kubernetes Service), and cloud security configurations.',
    },
    {
      keys: ['terraform', 'iac', 'infrastructure as code'],
      answer:
        'Syed has a dedicated <strong>Terraform project</strong> on GitHub featuring reusable modules, secure networking, and automated resource lifecycle management — a go-to pattern for consistent cloud provisioning.',
    },
    {
      keys: ['monitoring', 'observability', 'prometheus', 'grafana', 'logging', 'metric'],
      answer:
        'For observability, Syed uses <strong>Prometheus</strong> for metrics collection and <strong>Grafana</strong> for dashboards and alerting, ensuring full visibility into production systems.',
    },
    {
      keys: ['github', 'repo', 'open source', 'code'],
      answer:
        'Syed\'s GitHub (<a href="https://github.com/syedzeeshanusrathi-DevOps" target="_blank" style="color:#38bdf8">syedzeeshanusrathi-DevOps</a>) has several public repos including a Corporate DevOps Pipeline, 3-Tier Project, GitOps Register App, and more.',
    },
    {
      keys: ['resume', 'cv', 'download'],
      answer:
        'You can <a href="Syed Zeeshan - Resume.pdf" download style="color:#38bdf8">download Syed\'s resume</a> directly from this page using the button in the hero section.',
    },
    {
      keys: ['hello', 'hi', 'hey', 'sup', 'yo'],
      answer:
        'Hey there! 👋 I\'m Syed\'s portfolio assistant. You can ask me about his <strong>skills</strong>, <strong>projects</strong>, <strong>experience</strong>, or how to <strong>get in touch</strong>.',
    },
    {
      keys: ['who', 'about', 'syed', 'person', 'yourself'],
      answer:
        'Syed Zeeshan Nusrathi is a <strong>Cloud & DevOps engineer</strong> with 8+ years of experience building secure, scalable cloud platforms and automating delivery pipelines for modern engineering teams.',
    },
  ];

  const FALLBACK =
    'Great question! I\'m best at answering about Syed\'s <strong>skills</strong>, <strong>projects</strong>, <strong>experience</strong>, or <strong>contact</strong> details. Try one of those topics!';

  function getAnswer(query) {
    const q = query.toLowerCase();
    for (const entry of KB) {
      if (entry.keys.some((k) => q.includes(k))) return entry.answer;
    }
    return FALLBACK;
  }

  function createMsg(html, role) {
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    el.innerHTML = html;
    return el;
  }

  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  function showTypingThenReply(messages, answer) {
    const typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    scrollToBottom(messages);

    setTimeout(() => {
      typing.remove();
      const msg = createMsg(answer, 'bot');
      messages.appendChild(msg);
      scrollToBottom(messages);
    }, 900 + Math.random() * 400);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('ai-chat-toggle');
    const win = document.getElementById('ai-chat-window');
    const closeBtn = document.getElementById('ai-chat-close');
    const messages = document.getElementById('ai-chat-messages');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const chips = document.querySelectorAll('.ai-chip');

    if (!toggle) return;

    // Greeting
    const greeting = createMsg(
      'Hi! I\'m Syed\'s AI portfolio assistant. Ask me about his <strong>skills</strong>, <strong>projects</strong>, <strong>experience</strong>, or <strong>contact</strong> info.',
      'bot'
    );
    messages.appendChild(greeting);

    toggle.addEventListener('click', () => {
      win.classList.toggle('open');
      if (win.classList.contains('open')) input.focus();
    });

    closeBtn.addEventListener('click', () => win.classList.remove('open'));

    function send() {
      const text = input.value.trim();
      if (!text) return;
      messages.appendChild(createMsg(text, 'user'));
      input.value = '';
      scrollToBottom(messages);
      showTypingThenReply(messages, getAnswer(text));
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent;
        send();
      });
    });
  });
})();
// ── end AI Chat Widget ────────────────────────────────────

const navToggle = document.getElementById('nav-toggle');
const header = document.querySelector('.site-header');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
}

const navLinks = document.querySelectorAll('.nav a');
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
  });
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 24) {
    header.classList.add('shadow');
  } else {
    header.classList.remove('shadow');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');

  // Add scroll-fade class to all non-hero animated elements
  const scrollTargets = document.querySelectorAll(
    '.section-grid > div, .skill-card, .project-card, .contact-card, .exp-item'
  );

  scrollTargets.forEach((el, i) => {
    el.classList.add('scroll-fade');
    // Stagger within each row of up to 4
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  });

  // Reveal elements as they enter the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  scrollTargets.forEach((el) => observer.observe(el));
});
