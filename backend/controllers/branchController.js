const { Branch } = require("../models");

// Get all branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({ where: { isDeleted: false } });
    // Return the branches in a consistent format
    res.json({ branches });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Error fetching branches" });
  }
};

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    if (!name) return res.status(400).json({ error: "Branch name is required" });

    const branch = await Branch.create({ name:name,address: address, phone: phone,  status:true });
    res.status(201).json(branch);
  } catch (error) {
    console.log("error from create branch controller", error)
    res.status(500).json({ error: "Error creating branch" });
  }
};

// Block a branch
exports.blockBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.status = !branch.status;
    await branch.save();
    res.json({ message: "Branch blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error blocking branch" });
  }
};

exports.deleteBranch = async (req,res) =>{
  try {
    const {id} = req.params
    const branch = await Branch.findByPk(id)
    if (!branch) return res.status(404).json({error: "Branch not fond"})

      branch.isDeleted = !branch.isDeleted
      await branch.save()
      return res.json({message: "Branch Deleted successfully"})
  } catch (error) {
    res.status(500).json({error: "Server Error"})
  }
}
