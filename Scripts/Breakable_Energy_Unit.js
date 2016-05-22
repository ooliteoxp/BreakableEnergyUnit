this.name        = "Breakable_Energy_Unit"; 
this.author      = "capt murphy"; 
this.copyright   = "2012 capt murphy";
this.licence     = "CC BY-NC-SA 3.0"; // see http://creativecommons.org/licenses/by-nc-sa/3.0/ for more info.
this.description = "Script to simulate combat damage to the standard energy unit"; 
this.version     = "1.1";

// event handler driven function for functions at startup - awards equipment to existing ship if first run with OXP.
this.startUp = function()
{
	this.warning = new SoundSource;
	this.warning.sound = "warning.ogg";
	this.getUnitSize();
	if (player.ship.equipmentStatus(this.energyUnitEQ) === "EQUIPMENT_UNAVAILABLE"){missionVariables.beu_status = this.energyUnitEQ; player.ship.awardEquipment(this.energyUnitEQ); missionVariables.beu_status = "OK"}
}
// choses which variant of equipment to install bases on ships maxEnergy. Repair price varies between variants.
this.getUnitSize = function()
{
	if (player.ship.maxEnergy < 256){this.energyUnitEQ = "EQ_BREAKABLE_ENERGY_UNIT_SMALL";}
	else if (player.ship.maxEnergy < 384){this.energyUnitEQ = "EQ_BREAKABLE_ENERGY_UNIT_MEDIUM";}
	else {this.energyUnitEQ = "EQ_BREAKABLE_ENERGY_UNIT_LARGE";}
}
	
// event handler driven function to fit equipment to newly purchased ship.
this.playerBoughtNewShip = function()
{
	this.getUnitSize();
	missionVariables.beu_status = this.energyUnitEQ;
	player.ship.awardEquipment(this.energyUnitEQ);
	missionVariables.beu_status = "OK";
}

// event handler driven function to control actions if equipment damaged in combat.
this.equipmentDamaged = this.equipmentDestroyed = function(equipment)
{
	if (this.shipRestore && equipment === this.energyUnitEQ) {missionVariables.beu_status = this.energyUnitEQ; return;}
	if ((equipment === this.energyUnitEQ) && (player.ship.equipmentStatus("EQ_NAVAL_ENERGY_UNIT") === "EQUIPMENT_OK" || player.ship.equipmentStatus("EQ_ENERGY_UNIT") === "EQUIPMENT_OK"))
	{
	player.ship.setEquipmentStatus(equipment,"EQUIPMENT_OK");
	if (player.ship.equipmentStatus("EQ_NAVAL_ENERGY_UNIT") === "EQUIPMENT_OK")
		{
			player.ship.setEquipmentStatus("EQ_NAVAL_ENERGY_UNIT","EQUIPMENT_DAMAGED");
		    player.consoleMessage ("Naval Energy Unit is damaged!", 2);
			return;
		}
	else
		{ 
			player.ship.setEquipmentStatus("EQ_ENERGY_UNIT","EQUIPMENT_DAMAGED");
			player.consoleMessage ("Extra Energy Unit is damaged!", 2);  
			return;
		}
	}
	if (equipment === this.energyUnitEQ)
	{
		var EQarray = player.ship.equipment;
		var EQdamaged = new Array;
		var counter;
		for(counter = 0; counter < EQarray.length; counter++)
		{
			if (player.ship.equipmentStatus(EQarray[counter])==="EQUIPMENT_DAMAGED")
			{EQdamaged.push(EQarray[counter]);EQarray.splice(counter,1);counter--;continue;}
			if (!EQarray[counter].isVisible || EQarray[counter] === equipment || !EQarray[counter].canBeDamaged)
			{EQarray.splice(counter,1);counter--;}
		}
		if (EQdamaged.length < 6 || Math.random() > 0.167) // reduced chance of equipment damage.
		{
			if (EQarray.length > 0) // damage an alternative equipment item if available.
			{
				var index = Math.floor(Math.random() * EQarray.length);
				player.ship.setEquipmentStatus(EQarray[index],"EQUIPMENT_DAMAGED");
				this.damagedEQ = EQarray[index];
				this.delayTimer = new Timer (this, this.delayMessage,0.25);
			}
			player.ship.setEquipmentStatus(equipment,"EQUIPMENT_OK");
			return;
		}
		missionVariables.beu_status = this.energyUnitEQ; // set status to equipment name so repair option will show.
		this.setupTimerFB();
	}
}

this.delayMessage = function()
{
 if (this.damagedEQ && player.ship.equipmentStatus(this.damagedEQ) === "EQUIPMENT_DAMAGED")
 {player.consoleMessage(this.damagedEQ.name + " damaged!"); delete this.damagedEQ;}
}
		
// event handler driven function for actions on launching and exiting witchspace.
this.shipLaunchedFromStation = this.shipExitedWitchspace = function()
{
	if (player.ship.equipmentStatus(this.energyUnitEQ) === "EQUIPMENT_OK" && missionVariables.beu_status !== "OK")
	{
		this.reset();	
	}
	if (missionVariables.beu_status !== "OK")
	{
		this.setupTimerFB();
	}
}

// event handler driven function to stop timers on docking or player death.
this.shipWillDockWithStation = this.shipDied = function()
{
	if (this.updateCallback)
		{
			removeFrameCallback(this.updateCallback);
			delete this.updateCallback;
		}
	if (this.warningTimer && this.warningTimer.isRunning)
		{
			this.warningTimer.stop();
			delete this.warningTimer;
		}
}

// creates timers if not already in existance otherwise restarts existing timers.
this.setupTimerFB = function()
{
	if (!this.updateCallback)
		{
			this.updateCallback = addFrameCallback(this.updateEnergy.bind(this));
		}
	if (!this.warningTimer)
		{
			this.warningTimer = new Timer(this,this.warningSound,0,10);
		}
		else
		{
			this.warningTimer.start();
		}
}

this.updateEnergy = function()
{	
	if (player.ship.equipmentStatus(this.energyUnitEQ) === "EQUIPMENT_OK" && missionVariables.beu_status !== "OK") 
	{
		this.reset();
		return;
	}
	if (missionVariables.beu_status !== "OK")
	{
		player.ship.energy = 0.1;
	}
}
	

// called by timer every 10 seconds when player in flight to give warning noise while equipment is damaged.
this.warningSound = function()
{
	this.warning.play(1);
	player.consoleMessage("Core Energy Unit Damaged!", 2);
}

// function to reset equipment once fixes
this.reset = function()
{
	if (player.ship.equipmentStatus(this.energyUnitEQ) === "EQUIPMENT_OK" && missionVariables.beu_status !== "OK")
	{
		missionVariables.beu_status = "OK";
		if (this.updateCallback)
			{
				removeFrameCallback(this.updateCallback);
				delete this.updateCallback;
			}
		if (this.warningTimer && this.warningTimer.isRunning)
			{
				this.warningTimer.stop();
				delete this.warningTimer;
			}
	}
}