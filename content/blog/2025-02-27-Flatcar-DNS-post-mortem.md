+++
tags = ["flatcar", "Post Mortem", "CNCF" ]
topics = ["Post Mortem"]
authors = ["danielle-tal"]
title = "Learning from the Flatcar DNS Outage – A Post-Mortem"
draft = false
description = "Learning from the Flatcar DNS Outage – A Post-Mortem"
date = "2025-02-27T00:22:13+02:00"
postImage = "/datacenter-servers.jpg"
aliases = ["/blog/2025/02/flatcar-dns-post-mortem/"]
+++


On February 2nd and 3rd, 2025, Flatcar experienced a significant DNS outage that affected our update and release servers, as well as parts of our CI/CD infrastructure.
As a result, users were unable to download new Flatcar releases, retrieve Flatcar images for several hours. The root cause was a miscommunication during a domain transfer, which led to DNS mis-configurations.

In collaboration with the Linux Foundation (LF) IT team, we have conducted a full post-mortem analysis to understand the issue, improve our processes, and ensure greater reliability for the Flatcar community moving forward.

---

### What Happened?

As part of Flatcar’s transition to CNCF, domain ownership was being transferred to the Linux Foundation’s registrar.
However, Flatcar’s domain management is complex, involving multiple services: INWX for domain ownership, AWS Route 53 for releases, and Cloudflare for the website.

When requesting the transfer, Flatcar did not intend for the LF to manage DNS.
However, assuming the LF would need to configure NS and SOA for the domain, they uploaded the zone files and selected Yes for DNS transfer.
The LF initiated the domain and the dns transfer with the incomplete zone files.
This led to some DNS information not being transferred. Specifically:

* Vital Route 53 SOA records present in the zone files were omitted.
  This led to the release and update servers becoming unreachable.  
* PTR records pointing to Cloudflare were missing entirely from the zone files exported by the former domain hoster.
  This led to the web server becoming unreachable.  
* The LF IT team interpreted the incomplete zone files as indicating that the domains had no active services, leading to the assumption that it was safe to proceed with the DNS transfer.
  No additional validations like accessing web pages or querying DNS servers were performed before the transfer.

The issue became apparent late on Sunday evening (CET), but due to maintainers returning from FOSDEM and lack of an immediate escalation channel, troubleshooting and resolution were delayed.

By the time LF IT and Flatcar maintainers were able to coordinate on Monday, the missing records were swiftly identified, and LF IT corrected the name server settings immediately, restoring service after DNS propagation.

---

### **Impact**

* Users were unable to download new Flatcar releases or access hosted images.  
* The Flatcar CI/CD pipeline was disrupted, delaying development processes and affecting external integrations.  
* Some Flatcar-based workloads depending on automatic updates encountered temporary failures.

---

### **What We’ve Learned**

This outage highlighted several areas where both the Flatcar team and LF IT can improve:

1. **Clearer DNS Transfer Procedures**  
   * We will improve documentation and communication regarding DNS ownership and management responsibilities.  
2. **Pre-Transfer Validation Steps**  
   * Before executing future transfers, the LF  will get final confirmation whether the LF is or is not managing DNS, and if not, that the NS are correct at the current DNS provider. We will also confirm the time the transfer will begin.    
3. **Better Monitoring & Alerting**  
   * We will implement proactive DNS monitoring to detect mis-configurations before they cause outages.  
4. **Improved Coordination for Domain Transfer Initiation**  
   * We will agree on a time to begin the transfer process and communicate this maintenance window so that the community is aware. 

---

### **Next Steps**

 ✅**Stronger DNS Documentation**: Clearly define what is managed via Cloudflare, Route53, and other platforms.  
 ✅ **Process Enhancements**: Introduce additional verification steps before executing DNS changes.  
 ✅ **Improved Collaboration**: Coordinate a maintenance window when domain transfers will occur.

We recognize the impact this incident had on our users, and we deeply appreciate the patience and support from our community. Our goal is to make Flatcar as resilient and reliable as possible, and these changes will help us prevent similar issues in the future.

We would like to extend our warmest thanks to our Linux Foundation peers who tirelessly worked with us to resolve the issues.

Thank you for being part of the Flatcar community. If you have any questions or feedback, feel free to reach out via our [matrix channel](https://app.element.io/#/room/#flatcar:matrix.org), GitHub discussions, or Kubernetes Slack (\#flatcar).

**\- The Flatcar Team & LF IT**

