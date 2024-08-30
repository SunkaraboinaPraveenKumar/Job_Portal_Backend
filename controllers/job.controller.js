import { Job } from "../models/job.model.js";

export const postJob=async (req,res)=>{
    try{
        const {title,description,requirements,salary,location,jobType,experience,position,companyId}=req.body;
        const userId=req.id; //middleware authentication

        if(!title||!description||!requirements||!salary||!location||!jobType||!experience||!position||!companyId){
            return res.status(400).json({message:'All fields are required', success:false})
        }
        const job=await Job.create({
            title,
            description,
            requirements:requirements.split(','),
            salary:Number(salary),
            location,
            jobType,
            experience,
            position,
            created_by:userId,
            company:companyId
        });
        return res.status(201).json({message:'New Job created successfully', success:true, job})
    }
    catch(error){
        console.error(error);
    }
}

export const getJobs=async (req,res)=>{
    try{
        const keyword=req.query.keyword||"";
        const query={
            $or:[
                {title:{$regex:keyword,$options:"i"}},
                {description:{$regex:keyword,$options:"i"}},
            ]
        };
        const jobs=await Job.find(query).populate({
            path:'company'
        }).sort({createdAt:-1});
        if(!jobs){
            return res.status(404).json({message:'No jobs found', success:false})
        }
        return res.status(200).json({message:'Jobs found', success:true, jobs})
    }
    catch(error){
        console.error(error);
    }
}


export const getJobById=async (req,res)=>{
    try{
        const jobId=req.params.id;
        const job=await Job.findById(jobId).populate(
            {
                path:'company'
            }
        );
        if(!job){
            return res.status(404).json({message:'Job not found', success:false})
        }
        return res.status(200).json({message:'Job found', success:true, job})
    }
    catch(error){
        console.error(error);
    }
}

//admin jobs creation
export const getAdminJobs=async (req,res)=>{
    try{
        const adminId=  req.id;
        const jobs=await Job.find({created_by:adminId}).populate({
            path:'company'
        }).sort({createdAt:-1});
        if(!jobs){
            return res.status(404).json({message:'No jobs found', success:false})
        }
        return res.status(200).json({message:'Jobs found', success:true, jobs})
    }
    catch(error){
        console.error(error);
    }
}