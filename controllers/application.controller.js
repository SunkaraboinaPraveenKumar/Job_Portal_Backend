import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId) {
            return res.status(400).json({ message: 'Invalid job ID', success: false });
        }

        // Check if user already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this job', success: false });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job Not Found', success: false });
        }

        // Save application
        const application = await Application.create({
            job: jobId,  // Change jobId to job
            applicant: userId,
        });

        job.application.push(application._id);  // Update the field name to match your schema
        await job.save();

        return res.status(201).json({ message: 'Job Applied successfully', success: true, application });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', success: false });
    }
};


export const getAppliedJobs=async (req,res)=>{
    try{
        const userId=req.id;
        const applications=await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        })
        if(!applications){
            return res.status(404).json({message:'No applications found', success:false})
        }
        return res.status(200).json({message:'Applications found', success:true, applications})
    }
    catch(error){
        console.log(error);
    }
}

export const getJobApplicants=async (req,res)=>{
    try{
        const jobId=req.params.id;
        const job=await Job.findById(jobId).populate({
            path:'application',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        })
        if(!job){
            return res.status(404).json({message:'Job Not Found', success:false})
        }
        return res.status(200).json({
            message:'Job Applicants found',
            success:true,
            job
        })
    }
    catch(error){
        console.log(error);
    }
}

export const updateStatus = async (req, res) => {
    try {
        let { status } = req.body;
        const applicationId = req.params.id;

        if (!status) {
            return res.status(400).json({ message: 'Invalid status', success: false });
        }

        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

        const application = await Application.findOne({ _id: applicationId });
        if (!application) {
            return res.status(404).json({ message: 'Application Not Found', success: false });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            message: 'Application status updated successfully',
            success: true,
            application,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', success: false });
    }
};
