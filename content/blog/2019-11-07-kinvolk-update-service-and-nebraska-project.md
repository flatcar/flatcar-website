+++
authors = ["Joaquim Rocha"]
date = "2019-11-07T16:25:00+01:00"
title = "Announcing the Kinvolk Update Service and Nebraska Project"
draft = false
tags = ["flatcar", "nebraska", "announcement", "update-server"]
topics = ["flatcar", "nebraska", "omaha"]
postImage = "nebraska-corn.jpg"
+++

In this post, we’ll dive into the details of Kinvolk Update Service and share more about the heritage, functionality, and implementation. Of course, Kinvolk Update Service is built on 100% Open Source Software, which we are also making available today [on github](https://github.com/kinvolk/nebraska) as the Nebraska project.


## Motivation

When having a number of Flatcar Container Linux instances that compose a cluster, it is useful to have a tool to roll out updates, and to monitor the status of the instances and the updates progress. i.e. How many instances are currently downloading version X.Y.Z in our cluster? And how many should be updated to the new beta version?


## Heritage

Flatcar Container Linux is based on CoreOS Container Linux, and there is an official update manager solution for CoreOS in form of a web application, called CoreUpdate. However, it is not Open Source and was only available with a paid CoreOS subscription.

Luckily an Open Source alternative called CoreRoller existed. This project offered most of the functionality we desired for our Flatcar Linux subscription clients, but was inactive for a few years, which in Javascript years (used for its frontend) meant a large number of CVEs in the Node packages’ outdated versions, as well as other deprecated or inactive libraries used.

While CoreRoller provided a good starting point, we wanted to build a more advanced solution for the Kinvolk Update Service. Specifically, we aimed to provide a more modern UI and other ways to visualize the updates and states of the cluster. Besides that, we also need to deploy this new service to clients and update it quickly in case of new security fixes or new features. So we concluded that the easiest way to do all this was to build our own version, but starting from and building on the great work done by the authors of CoreRoller.

This new project is called Nebraska and is, of course, completely Open Source software. It powers the Kinvolk Update Service, which is a branded build of Nebraska, hosted and managed by Kinvolk for our subscription customers. There is no *community vs corporate* versions strategy here, so as with all Kinvolk software, customers can feel safe knowing there is no vendor lock-in strategy behind our offering of Kinvolk Update Service with their Flatcar Container Linux Subscriptions.


## Features

So what can the Kinvolk Update Service do for you? What functionality does it have?

Here is a summarized list of capabilities:



*   Control of updates behavior / rate limiting
*   Custom groups and channels
*   Update progress overview
*   Versions evolution timeline
*   Detailed history per machine
*   Authentication through Github
*   Distribution of updates payload or redirection
*   Automatic fetch of new packages’ metadata
*   … (we’ll keep working on more!)


## How it’s built

The Kinvolk Update Service, or Nebraska, is composed by a backend that is written in Golang, and a frontend in the form of a web-app, using React and Material UI. A typical overview of how it is deployed is illustrated in the following diagram:

<figure class="img-fluid w-75 mx-auto">
	<img src="/media/nebraska_arch_services.png" width="75%" class="img-fluid" alt="Diagram showing a Flatcar Container Linux cluster communicating with the Kinvolk Update Service through the Omaha protocol (which is composed of backend and frontend), which in turn gets the update payload from an external payload server.">
</figure>


One thing that’s illustrated in the diagram but may not be obvious is that Nebraska is a passive service, in the sense that it is the instances that connect to it giving information about their status, and not Nebraska that connects to instances. So all the data maintained and displayed by Nebraska is about past events (that happened in the last 24 hours by default).


## Architecture

In order to better understand the capabilities of the Kinvolk Update Service in what comes to representing one’s clusters, it’s important to look into its architecture.

The first actor in this architecture is the Application, or App. It represents the entity for which we will monitor and manage the updates. An obvious and common example of an Application in this sense is Flatcar Container Linux, but the Kinvolk Update Service can actually support any other application that shares the protocol it uses for managing the updates. This protocol is called Omaha and was created by Google for managing the updates of apps like Chrome and Google Earth. Thus, any applications/services that use the Omaha protocol can be expected to work with the Update Service.

An Application may have one or more groups. A Group is a very important part of the architecture, since it is where the policy for the actual updates is defined. i.e. what update is to be rolled out, when, to how many instances, at what times, etc. is all defined per Group.

What a Group represents is entirely up to the user though. It may be one flavor of software (e.g. the Edge variant for Flatcar Linux), a geo-location of a cluster (e.g. _Central European Cluster_), different deployment clusters (e.g. Test Cluster), etc. It is entirely up to the user to choose what Groups represent.

Groups need to know which software and version to provide to their instances, and that’s provided by the next level in our architecture called Channels. However, Channels don’t hold the information about the package directly, but instead point to last level in the architecture: Packages.

A common question at this point is usually: “Why is this level of indirection needed? Why can’t Groups just contain the software+version that compose the actual update, or point themselves to a Package object?”

This can be better answered with an example: if we have several groups that need to point to the stable version of a software, then we just have to have a Channel representing that stable version and point the Groups to the Channel; then, when the stable version is bumped (i.e. the Channel starts pointing to a new Package) all the Groups automatically point to it, instead of having to edit every Group and make them point to the new Package.

Finally here are two similar diagrams, one illustrating what was described above, and the other with an example:


<div class="row">

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/nebraska_arch.png" class="img-fluid" alt="Diagram showing an App containing 3 groups, which in turn 2 of them are connected to the same channel, and the other group is connected to a different channel. Each channel is connected to a package.">
</figure>
</div>

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/nebraska_arch_labeled.png" class="img-fluid" alt="The same diagram as before but illustrating a real-world example: the app is called Flatcar, the groups are called Deploy Cluster 1, Deploy Cluster 2, and Test Cluster, respectively. The first two groups are both connected to the Stable channel which the Test Cluster group is connected to the Beta channel. Each channel is connected to a Flatcar package (Stable is connected to Flatcar version v1.0, and Beta is connected to Flatcar v1.2b).">
</figure>
</div>

</div>



This setup should allow enough flexibility to represent any clusters. But let’s look at example use-cases to have a more practical idea of what this project allows.


## Use Cases


### Rate Limiting

A company has only 1 cluster of Flatcar Linux machines. It wants the machines to be updated as the new stable version of Flatcar Linux becomes available, but only 10 machines per hour should be updated (so if a number of them fails, it is more noticeable).

What can be done:



*   Run Kinvolk Update Server with the syncer on, to get the _stable_ channel updated automatically;
*   Create a group for the cluster, pointing to the _stable_ channel;
*   Watch the success rate for updates as they happen.


### Two Different Purpose Clusters

A team is responsible for 2 clusters: Production + Testing. They want the Testing cluster to have its machines updated to Flatcar Linux Stable version automatically and as soon as it becomes available. The Production cluster on the other hand needs to be running the stable version but updates should be started when QA gives the green light (after using the Testing cluster), and updates should be done safely (1 machine at a time, abort when there’s a failure).

What can be done:


*   Testing’s updates can be triggered automatically, for as many instances at a time and as soon as available to the new stable becomes available (which is automatically done when using the _syncer_ option).
*   Production’s updates can be triggered manually (i.e. its Group will have updates disabled by default), and have the Safe option turned on (1 instance updated at a time, abort on first failure).


### Different Geo-locations

A global company has two clusters, one in San Francisco, California, one in Berlin, Germany. Their instances should be updated automatically, but only during the respective office hours.

What can be done:



*   Run Kinvolk Update Server with the syncer on, to get the desired channel updated automatically;
*   Set up a group for each geo-location (they can be called _US West Coast_, and _Central Europe_ for example);
*   Set up the timezone/office hours for each group and enable updates


## Future

There are certainly improvements we can do to the Kinvolk Update Service / Nebraska, and Kinvolk will keep investing in that. Some ideas we aim to implement in the future are:


*   CLI for managing and testing;
*   More ways to visualize the gathered information (new charts, tables, etc.) ;
*   Custom timeline filtering;
*   Performance improvements;
*   UX improvements.

Finally, and as previously mentioned, Nebraska is 100% Open Source and we welcome contributions. If you have a bug fix you want to add, or a feature you want to implement, it is recommendable to first open an issue about it and discuss it in its Github project before writing the code (especially if it is a complex feature).

The Kinvolk team hopes you enjoy its new product. We’d love to hear your thoughts and feedback - via email ([hello@kinvolk.io](mailto:hello@kinvolk.io)), or Twitter (@kinvolkio).

<div class="row">

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/update_service_main.png" class="img-fluid border" alt="Applications list page in the Kinvolk Update Service">
</figure>
</div>

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/update_service_groups.png" class="img-fluid border" alt="Application view showing the groups list in the Kinvolk Update Service">
</figure>
</div>

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/update_service_group_details.png" class="img-fluid border" alt="Group view in the Kinvolk Update Service">
</figure>
</div>

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/update_service_timeline.png" class="img-fluid border" alt="Updates timeline view in the Kinvolk Update Service">
</figure>
</div>

<div class="col-lg-6">
<figure class="img-fluid w-75 mx-auto">
	<img src="/media/update_service_instances.png" class="img-fluid border" alt="Instance list view in the Kinvolk Update Service">
</figure>
</div>

</div>
